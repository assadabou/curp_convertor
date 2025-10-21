import Papa from 'papaparse';
import { convertToISO8601 } from './timestampUtils';

export interface TimestampCsvRow {
  identifier: string;
  ip_address: string;
  privacy_notice_url: string;
  timestamp: string;
  [key: string]: string;
}

export interface ParsedTimestampCsvData {
  rows: TimestampCsvRow[];
  errors: string[];
}

/**
 * Normalize column name for flexible matching
 */
function normalizeColumnName(name: string): string {
  return name.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * Find column value by trying different name variations
 */
function findColumnValue(row: any, possibleNames: string[]): string | undefined {
  // Try exact matches first
  for (const name of possibleNames) {
    if (row[name] !== undefined) {
      return row[name];
    }
  }

  // Try normalized matches
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalized = normalizeColumnName(name);
    for (const key of rowKeys) {
      if (normalizeColumnName(key) === normalized) {
        return row[key];
      }
    }
  }

  return undefined;
}

/**
 * Parse CSV file with timestamp data
 */
export function parseTimestampCsv(file: File): Promise<ParsedTimestampCsvData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: TimestampCsvRow[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Try to find each column with flexible matching
            const identifier = findColumnValue(row, ['identifier', 'id', 'ID', 'Identifier']);
            const ipAddress = findColumnValue(row, ['ip_address', 'ipaddress', 'ip', 'IP', 'IP Address']);
            const privacyNoticeUrl = findColumnValue(row, ['privacy_notice_url', 'privacynoticeurl', 'privacy_url', 'url', 'URL']);
            const timestamp = findColumnValue(row, ['timestamp', 'time', 'date', 'datetime', 'Timestamp']);

            // Validate required fields
            if (!timestamp || timestamp.trim() === '') {
              errors.push(`Row ${index + 2}: Missing timestamp`);
              return;
            }

            // Add row with all original columns preserved
            rows.push({
              identifier: identifier?.trim() || '',
              ip_address: ipAddress?.trim() || '',
              privacy_notice_url: privacyNoticeUrl?.trim() || '',
              timestamp: timestamp.trim(),
              ...row // Preserve all original columns
            });
          } catch (error) {
            errors.push(`Row ${index + 2}: Error parsing row - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        if (rows.length === 0 && errors.length === 0) {
          errors.push('No valid data found in CSV. Make sure the file has a "timestamp" column.');
        }

        resolve({ rows, errors });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Convert timestamp rows to result rows with converted timestamps
 */
export interface TimestampResultRow {
  [key: string]: string;
}

export function convertTimestampRows(rows: TimestampCsvRow[]): TimestampResultRow[] {
  return rows.map(row => {
    const result: TimestampResultRow = {
      ...Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value || ''])
      )
    };

    try {
      // Convert the timestamp
      result.timestamp = convertToISO8601(row.timestamp);
      result.conversion_error = '';
    } catch (error) {
      result.conversion_error = error instanceof Error ? error.message : 'Conversion failed';
    }

    return result;
  });
}

