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
        let errorMessage = `Failed to process CSV (HTTP ${response.status}: ${response.statusText})`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          if (errorData.details) {
            errorMessage += ` - Details: ${errorData.details}`;
          }
        } catch (parseError) {
          // If we can't parse the error response, include the raw response
          const responseText = await response.text().catch(() => 'Unable to read response');
          if (responseText && responseText !== 'Unable to read response') {
            errorMessage += ` - Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`;
          }
        }
        
        throw new Error(errorMessage);
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
      let errorMessage = 'An error occurred while processing the CSV';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Add more context for common errors
        if (err.message.includes('CSV parsing error')) {
          errorMessage += ' - Please check that your file is a valid CSV format with proper headers';
        } else if (err.message.includes('CURP')) {
          errorMessage += ' - Please verify that your CURP values are valid 18-character codes';
        } else if (err.message.includes('full_name')) {
          errorMessage += ' - Ensure your CSV has a "full_name" column with complete names';
        } else if (err.message.includes('No valid data')) {
          errorMessage += ' - Make sure your CSV has the required columns: full_name, curp';
        } else if (err.message.includes('413') || err.message.includes('Payload Too Large')) {
          errorMessage += ' - Your CSV file is too large. Try splitting it into smaller files (under 50MB)';
        } else if (err.message.includes('500') || err.message.includes('Internal server error')) {
          errorMessage += ' - Server processing error. Please try again or contact support if the issue persists';
        } else if (err.message.includes('timeout')) {
          errorMessage += ' - Request timed out. Try with a smaller CSV file or try again later';
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
          <p style={{ marginTop: '8px', fontSize: '0.85em', color: '#666' }}>
            📋 <strong>Additional Columns:</strong> Any extra columns in your CSV (employee_id, department, email, etc.) will be preserved and included in the output file.
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

