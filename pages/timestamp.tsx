import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { parseTimestampCsv, convertTimestampRows, TimestampResultRow } from '../utils/timestampCsvUtils';
import { generateCsv, downloadCsv } from '../utils/csvUtils';
import { TIMESTAMP_FORMAT_EXAMPLES } from '../utils/timestampUtils';
import styles from '../styles/Home.module.css';

export default function TimestampConverter() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TimestampResultRow[]>([]);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [resultColumns, setResultColumns] = useState<string[]>([]);

  const handleCsvFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setError('');
      setSuccessMessage('');
      setResults([]);
      setResultColumns([]);
    }
  };

  const handleCsvUpload = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setResults([]);
    setResultColumns([]);

    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const { rows, errors } = await parseTimestampCsv(csvFile);

      if (errors.length > 0) {
        setError(`CSV parsing warnings: ${errors.join(', ')}`);
      }

      if (rows.length === 0) {
        setError('No valid data found in CSV file');
        setLoading(false);
        return;
      }

      // Convert timestamps
      const convertedResults = convertTimestampRows(rows);
      setResults(convertedResults);

      // Determine columns from first result
      if (convertedResults.length > 0) {
        const columns = Object.keys(convertedResults[0]);
        setResultColumns(columns);
      }

      // Generate and download CSV
      const csvContent = generateCsv(convertedResults);
      downloadCsv(csvContent, 'timestamps_converted.csv');

      const successCount = convertedResults.filter(
        (r: TimestampResultRow) => !r.conversion_error || r.conversion_error === ''
      ).length;
      setSuccessMessage(
        `Successfully converted ${successCount}/${convertedResults.length} timestamps. CSV downloaded.`
      );
    } catch (err) {
      let errorMessage = 'An error occurred while processing the CSV';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Add more context for common errors
        if (err.message.includes('CSV parsing error')) {
          errorMessage += ' - Please check that your file is a valid CSV format';
        } else if (err.message.includes('timestamp')) {
          errorMessage += ' - Please verify that your timestamp column contains valid date/time values';
        } else if (err.message.includes('No valid data')) {
          errorMessage += ' - Ensure your CSV has the required columns: identifier, ip_address, privacy_notice_url, timestamp';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to CURP/RFC Converter
          </Link>
        </div>

        <h1 className={styles.title}>Timestamp Converter</h1>
        <p className={styles.description}>
          Convert human-readable timestamps to ISO 8601 format
        </p>

        <div className={styles.grid}>
          <div className={styles.card} style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2>CSV Upload</h2>
            <form onSubmit={handleCsvUpload}>
              <div className={styles.fileInput}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  disabled={loading}
                  id="csvFile"
                />
                <label htmlFor="csvFile" className={styles.fileLabel}>
                  {csvFile ? csvFile.name : 'Choose CSV file'}
                </label>
              </div>
              <div className={styles.hint}>
                <p><strong>Required CSV columns:</strong></p>
                <ul style={{ textAlign: 'left', marginTop: '8px' }}>
                  <li><strong>identifier</strong>: Unique identifier</li>
                  <li><strong>ip_address</strong>: IP address</li>
                  <li><strong>privacy_notice_url</strong>: URL to privacy notice</li>
                  <li><strong>timestamp</strong>: Human-readable timestamp</li>
                </ul>
                <p style={{ marginTop: '12px', fontSize: '0.9em' }}>
                  <strong>Supported timestamp formats:</strong>
                </p>
                <ul style={{ textAlign: 'left', fontSize: '0.85em', color: '#666' }}>
                  {TIMESTAMP_FORMAT_EXAMPLES.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
                <p style={{ marginTop: '12px', fontSize: '0.9em' }}>
                  Output format: <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>
                    YYYY-MM-DDTHH:mm:ss.nnnnnnnnnZ
                  </code>
                </p>
              </div>
              <button
                type="submit"
                className={styles.button}
                disabled={loading || !csvFile}
              >
                {loading ? 'Converting...' : 'Upload & Convert'}
              </button>
            </form>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div className={styles.success}>
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className={styles.results}>
            <h3>Results Preview</h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Showing first {Math.min(results.length, 10)} of {results.length} rows. Full results
              have been downloaded.
            </p>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {resultColumns.map((column, index) => (
                      <th key={index}>{column.replace(/_/g, ' ').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 10).map((result, index) => (
                    <tr key={index}>
                      {resultColumns.map((column, colIndex) => (
                        <td key={colIndex}>
                          {column === 'conversion_error' && result[column] ? (
                            <span className={styles.errorText}>{result[column]}</span>
                          ) : column === 'conversion_error' && !result[column] ? (
                            <span className={styles.successText}>✓</span>
                          ) : (
                            <span
                              style={{
                                fontSize: column === 'timestamp' ? '0.85em' : 'inherit',
                                fontFamily: column === 'timestamp' ? 'monospace' : 'inherit',
                              }}
                            >
                              {result[column] || '-'}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>Timestamp Converter</p>
      </footer>
    </div>
  );
}

