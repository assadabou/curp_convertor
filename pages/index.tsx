import { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { parseCsvFile, generateCsv, downloadCsv } from '../utils/csvUtils';
import styles from '../styles/Home.module.css';

interface ConversionResult {
  [key: string]: string;
}

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ConversionResult[]>([]);
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
      const { rows, errors } = await parseCsvFile(csvFile);

      if (errors.length > 0) {
        setError(`CSV parsing warnings: ${errors.join(', ')}`);
      }

      if (rows.length === 0) {
        setError('No valid data found in CSV file');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows }),
      });

      if (!response.ok) {
        throw new Error('Failed to process CSV');
      }

      const data = await response.json();
      setResults(data.results);

      // Determine columns from first result
      if (data.results.length > 0) {
        const columns = Object.keys(data.results[0]);
        setResultColumns(columns);
      }

      // Generate and download CSV
      const csvContent = generateCsv(data.results);
      downloadCsv(csvContent);
      
      const successCount = data.results.filter((r: ConversionResult) => !r.error || r.error === '').length;
      setSuccessMessage(`Successfully processed ${successCount}/${data.results.length} rows. CSV downloaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
          <Link href="/timestamp" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '0.95em' }}>
            Timestamp Converter →
          </Link>
        </div>

        <h1 className={styles.title}>CURP & RFC Generator</h1>
        <p className={styles.description}>
          Generate CURP and RFC from personal information
        </p>

        <div className={styles.grid}>
          {/* CSV Upload */}
          <div className={styles.card} style={{ maxWidth: '600px', margin: '0 auto' }}>
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
                  <li><strong>full_name</strong>: Full name (e.g., "Miguel Arroyo De La Cruz")</li>
                  <li><strong>curp</strong>: Valid CURP (18 characters)</li>
                </ul>
                <p style={{ marginTop: '12px', fontSize: '0.9em' }}>
                  The system uses intelligent name parsing with CURP validation to accurately split names into components. Birth date, sex, and state are automatically extracted from the CURP.
                </p>
                <p style={{ marginTop: '8px', fontSize: '0.85em', fontStyle: 'italic' }}>
                  💡 CURP Intelligence: The system validates your name parsing against CURP structure for maximum accuracy!
                </p>
              </div>
              <button
                type="submit"
                className={styles.button}
                disabled={loading || !csvFile}
              >
                {loading ? 'Processing...' : 'Upload & Generate'}
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
              Showing first {Math.min(results.length, 10)} of {results.length} rows. Full results have been downloaded.
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
                          {column === 'error' && result[column] ? (
                            <span className={styles.errorText}>{result[column]}</span>
                          ) : column === 'error' && !result[column] ? (
                            <span className={styles.successText}>✓</span>
                          ) : (
                            result[column] || '-'
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
        <p>CURP & RFC Generator</p>
      </footer>
    </div>
  );
}

