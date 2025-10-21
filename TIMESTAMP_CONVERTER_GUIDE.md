# Timestamp Converter Feature Guide

## Overview

The Timestamp Converter is a new tab in the application that converts human-readable timestamps to ISO 8601 format with nanosecond precision.

---

## Features

✅ **Multiple Format Support**: Accepts various human-readable date/time formats
✅ **ISO 8601 Output**: Converts to standard format with nanosecond precision
✅ **Bulk Processing**: Process entire CSV files at once
✅ **Error Tracking**: Clear error messages for failed conversions
✅ **Column Preservation**: All original columns are preserved in output
✅ **Flexible Column Matching**: Case-insensitive column name matching

---

## Input Requirements

### Required CSV Columns

- **identifier**: Unique identifier for the record
- **ip_address**: IP address
- **privacy_notice_url**: URL to privacy notice
- **timestamp**: Human-readable timestamp

### Supported Timestamp Formats

The converter uses JavaScript's `Date` parser, which supports:

1. **Long Format**: "August 20, 2025, 10:52 AM"
2. **Short Month**: "Aug 20, 2025 10:52 AM"
3. **ISO-like**: "2025-08-20 10:52:30"
4. **Slash Format**: "2025/08/20 10:52"
5. **US Format**: "08/20/2025 10:52 AM"
6. **ISO 8601**: "2025-08-20T10:52:00"
7. **Day-Month-Year**: "20 August 2025 10:52"

---

## Output Format

### ISO 8601 with Nanosecond Precision

```
YYYY-MM-DDTHH:mm:ss.nnnnnnnnnZ
```

**Components:**
- `YYYY`: 4-digit year
- `MM`: 2-digit month (01-12)
- `DD`: 2-digit day (01-31)
- `T`: Separator
- `HH`: 2-digit hour (00-23) in UTC
- `mm`: 2-digit minutes (00-59)
- `ss`: 2-digit seconds (00-59)
- `nnnnnnnnn`: 9-digit nanoseconds (always 000000000 as source has no nanoseconds)
- `Z`: UTC timezone indicator

**Example:**
```
Input:  "August 20, 2025, 10:52 AM"
Output: "2025-08-20T10:52:00.000000000Z"
```

---

## How It Works

### 1. CSV Upload

User uploads a CSV file with the required columns. The system:
- Parses the CSV using PapaParse
- Validates column presence (flexible matching)
- Preserves all original columns

### 2. Timestamp Conversion

For each row:
```typescript
1. Read the timestamp string
2. Parse using JavaScript Date constructor
3. Convert to UTC timezone
4. Extract components (year, month, day, hour, minute, second, millisecond)
5. Format as ISO 8601 with 9-digit nanoseconds
6. Handle errors gracefully
```

### 3. Output Generation

- Preserves all original columns
- Updates timestamp column with converted value
- Adds `conversion_error` column for error tracking
- Generates downloadable CSV

---

## Example Usage

### Input CSV

```csv
identifier,ip_address,privacy_notice_url,timestamp
USER001,192.168.1.100,https://example.com/privacy,"August 20, 2025, 10:52 AM"
USER002,192.168.1.101,https://example.com/privacy,"September 10, 2025, 9:40 PM"
USER003,10.0.0.50,https://example.com/privacy,"Dec 25, 2024 3:15 PM"
USER004,172.16.0.1,https://example.com/privacy,2025-01-15 08:30:00
```

### Output CSV

```csv
identifier,ip_address,privacy_notice_url,timestamp,conversion_error
USER001,192.168.1.100,https://example.com/privacy,2025-08-20T10:52:00.000000000Z,
USER002,192.168.1.101,https://example.com/privacy,2025-09-10T21:40:00.000000000Z,
USER003,10.0.0.50,https://example.com/privacy,2024-12-25T15:15:00.000000000Z,
USER004,172.16.0.1,https://example.com/privacy,2025-01-15T08:30:00.000000000Z,
```

---

## Implementation Details

### Files Created

1. **`utils/timestampUtils.ts`**
   - Core conversion logic
   - Validation functions
   - Format examples

2. **`utils/timestampCsvUtils.ts`**
   - CSV parsing for timestamp data
   - Column matching logic
   - Batch conversion processing

3. **`pages/timestamp.tsx`**
   - Main timestamp converter UI
   - File upload handling
   - Results display

4. **`timestamp_example.csv`**
   - Example file for users

### Key Functions

#### `convertToISO8601(timestamp: string): string`

Converts any valid date string to ISO 8601 format.

```typescript
convertToISO8601("August 20, 2025, 10:52 AM")
// Returns: "2025-08-20T10:52:00.000000000Z"
```

#### `isValidTimestamp(timestamp: string): boolean`

Validates if a string can be parsed as a date.

```typescript
isValidTimestamp("August 20, 2025")  // true
isValidTimestamp("Invalid Date")     // false
```

---

## Error Handling

### Invalid Timestamp

If a timestamp cannot be parsed:
```csv
identifier,ip_address,privacy_notice_url,timestamp,conversion_error
USER999,10.0.0.1,https://example.com/privacy,,"Unable to parse timestamp: invalid-date-string"
```

### Missing Timestamp

If the timestamp column is empty:
```csv
identifier,ip_address,privacy_notice_url,timestamp,conversion_error
USER999,10.0.0.1,https://example.com/privacy,,"Unable to parse timestamp: "
```

### Success

When conversion succeeds:
```csv
identifier,ip_address,privacy_notice_url,timestamp,conversion_error
USER001,192.168.1.100,https://example.com/privacy,2025-08-20T10:52:00.000000000Z,
```

---

## Navigation

### From Main Page to Timestamp Converter

Click the "Timestamp Converter →" link in the top-right of the CURP & RFC Generator page.

### From Timestamp Converter to Main Page

Click the "← Back to CURP/RFC Converter" link at the top of the Timestamp Converter page.

---

## Technical Considerations

### Timezone Handling

- All timestamps are converted to **UTC** timezone
- The `Z` suffix indicates UTC
- Local timezone information from input is preserved during parsing

### Nanosecond Precision

- JavaScript `Date` objects only support millisecond precision
- The output includes 9 digits after the decimal point
- Last 6 digits are always `000000` (microseconds and nanoseconds)
- Format: `sss.mmmuuunnn` where:
  - `sss` = milliseconds from Date object
  - `uuu` = microseconds (always 000)
  - `nnn` = nanoseconds (always 000)

### Date Parsing

Uses JavaScript's native `Date` constructor:
- Flexible format support
- Locale-aware
- Handles various separators and orderings
- Timezone detection from input string

---

## UI Features

### File Upload

- Drag & drop or click to browse
- Only accepts `.csv` files
- Shows selected filename
- Disable while processing

### Results Preview

- Shows first 10 rows
- Displays all columns
- Monospace font for timestamps (better readability)
- Color-coded success/error indicators
- Success: Green checkmark (✓)
- Error: Red error message

### Format Examples

Built-in list of supported formats shown in the UI helps users understand what timestamp formats are accepted.

---

## Future Enhancements

Potential improvements:

1. **Custom Output Format**: Allow users to specify output format
2. **Timezone Selection**: Let users choose output timezone (not just UTC)
3. **Batch Size Control**: Process large files in chunks
4. **Timestamp Validation**: Pre-validate before conversion
5. **Multiple Timestamp Columns**: Convert multiple columns at once

---

## Testing

### Test Cases

Create a test CSV with various formats:

```csv
identifier,ip_address,privacy_notice_url,timestamp
TEST001,127.0.0.1,https://test.com,"August 20, 2025, 10:52 AM"
TEST002,127.0.0.2,https://test.com,"2025-08-20 10:52:30"
TEST003,127.0.0.3,https://test.com,"08/20/2025 10:52 AM"
TEST004,127.0.0.4,https://test.com,"invalid date"
TEST005,127.0.0.5,https://test.com,""
```

**Expected Results:**
- TEST001-003: Successful conversion
- TEST004: Conversion error (invalid format)
- TEST005: Conversion error (empty timestamp)

---

## Summary

The Timestamp Converter is a complete, production-ready feature that:

✅ Accepts flexible input formats
✅ Produces standardized ISO 8601 output
✅ Handles errors gracefully
✅ Preserves original data
✅ Provides clear user feedback
✅ Integrates seamlessly with existing application

Access it by navigating to: `/timestamp` or clicking the navigation link!

