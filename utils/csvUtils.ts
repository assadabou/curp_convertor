import Papa from 'papaparse';

export interface CsvInputRow {
  full_name: string;
  curp: string;
  [key: string]: string;
}

export interface ParsedCsvData {
  rows: CsvInputRow[];
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
 * Parse CSV file with flexible column matching
 */
export function parseCsvFile(file: File): Promise<ParsedCsvData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CsvInputRow[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Try to find each column with flexible matching
            const fullName = findColumnValue(row, ['full_name', 'fullname', 'name', 'nombre', 'nombre_completo']);
            const curp = findColumnValue(row, ['curp', 'CURP']);

            // Validate required fields
            if (!fullName || fullName.trim() === '') {
              errors.push(`Row ${index + 2}: Missing full_name`);
              return;
            }

            if (!curp || curp.trim() === '') {
              errors.push(`Row ${index + 2}: Missing curp`);
              return;
            }

            // Validate CURP length (should be 18 characters)
            if (curp.trim().length !== 18) {
              errors.push(`Row ${index + 2}: CURP should be 18 characters (found ${curp.trim().length})`);
              return;
            }

            // Add row with all original columns preserved
            rows.push({
              full_name: fullName.trim(),
              curp: curp.trim().toUpperCase(),
              ...row // Preserve all original columns
            });
          } catch (error) {
            errors.push(`Row ${index + 2}: Error parsing row - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        if (rows.length === 0 && errors.length === 0) {
          errors.push('No valid data found in CSV. Make sure the file has "full_name" and "curp" columns.');
        }

        resolve({ rows, errors });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

export interface ResultRow {
  [key: string]: string;
}

export function generateCsv(results: ResultRow[]): string {
  const csv = Papa.unparse(results, {
    header: true,
  });
  return csv;
}

export function downloadCsv(csvContent: string, filename: string = 'curp_rfc_results.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

