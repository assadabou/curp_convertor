// Timestamp conversion utilities

/**
 * Parse various date/time formats and convert to ISO 8601 with nanoseconds
 * Examples:
 * - "August 20, 2025, 10:52 AM" -> "2025-08-20T10:52:00.000000000Z"
 * - "2025-08-20 10:52:30" -> "2025-08-20T10:52:30.000000000Z"
 */
export function convertToISO8601(timestamp: string): string {
  if (!timestamp || timestamp.trim() === '') {
    return '';
  }

  try {
    // Try to parse the date
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Get UTC components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    // Add nanoseconds (6 more zeros after milliseconds for full precision)
    const nanoseconds = milliseconds + '000000';

    // Format: YYYY-MM-DDTHH:mm:ss.nnnnnnnnnZ
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${nanoseconds}Z`;
  } catch (error) {
    throw new Error(`Unable to parse timestamp: ${timestamp}`);
  }
}

/**
 * Validate if a string can be converted to a valid date
 */
export function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp || timestamp.trim() === '') {
    return false;
  }

  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Format examples for user guidance
 */
export const TIMESTAMP_FORMAT_EXAMPLES = [
  'August 20, 2025, 10:52 AM',
  'Aug 20, 2025 10:52 AM',
  '2025-08-20 10:52:30',
  '2025/08/20 10:52',
  '08/20/2025 10:52 AM',
  '2025-08-20T10:52:00',
  '20 August 2025 10:52',
];

