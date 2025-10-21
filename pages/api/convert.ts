import { NextApiRequest, NextApiResponse } from 'next';
import { parseFullName, parseNameWithCURP } from '../../utils/nameParser';
import { 
  extractDataFromCURP, 
  extractBirthDate, 
  convertStateToCode,
  validateNameAgainstCURP,
  extractNameHintsFromCURP
} from '../../utils/dataExtractor';
import { generateRFC, generateCURP, generateRFCFromCURP } from '../../utils/rfcCurpGenerator';

interface InputRow {
  full_name: string;
  curp: string;
  [key: string]: string | undefined;
}

interface ConversionRequest {
  rows: InputRow[];
}

interface ConversionResult {
  [key: string]: string;
}

// Configure API route to accept larger payloads (50MB for CSV files)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rows } = req.body as ConversionRequest;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid request: rows array is required' });
    }

    const results: ConversionResult[] = [];

    // Process each row
    for (const row of rows) {
      try {
        const result: ConversionResult = {
          // Preserve all original columns
          ...Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value || ''])
          )
        };

        // Sophisticated name parsing with CURP validation
        // Use CURP hints to improve parsing accuracy if available
        const parsedName = parseNameWithCURP(
          row.full_name, 
          row.curp, 
          validateNameAgainstCURP
        );

        if (!parsedName.firstName) {
          result.error = 'Could not parse name';
          result.generated_curp = '';
          result.rfc = '';
          results.push(result);
          continue;
        }

        // Validate parsed name against CURP if available (quality check)
        if (row.curp && row.curp.length >= 4) {
          const isValid = validateNameAgainstCURP(
            parsedName.firstName,
            parsedName.paternalSurname,
            parsedName.maternalSurname,
            row.curp
          );
          
          // Log warning if name doesn't match CURP structure
          // But continue processing (user's name might be updated)
          if (!isValid) {
            console.warn(
              `Name parsing validation warning for "${row.full_name}": ` +
              `Parsed components may not match CURP structure`
            );
          }
        }

        // Extract all data from CURP
        const curpData = extractDataFromCURP(row.curp);
        
        if (!curpData) {
          result.error = 'Invalid CURP format - could not extract data';
          result.generated_curp = '';
          result.rfc = '';
          results.push(result);
          continue;
        }

        const birthDate = curpData.birthDate;
        const sex = curpData.sex || '';
        const state = curpData.state || '';

        if (!birthDate || !sex || !state) {
          result.error = 'Incomplete data in CURP';
          result.generated_curp = '';
          result.rfc = '';
          results.push(result);
          continue;
        }

        // Generate CURP and RFC
        const personData = {
          firstName: parsedName.firstName,
          paternalSurname: parsedName.paternalSurname || 'X',
          maternalSurname: parsedName.maternalSurname || 'X',
          birthDate,
          sex,
          state
        };

        const generatedCurp = generateCURP(personData);
        
        // Optimize RFC generation: use CURP-based method when available
        let generatedRfc: string;
        if (row.curp && row.curp.length >= 13) {
          try {
            // More efficient: extract data directly from existing CURP
            generatedRfc = generateRFCFromCURP(
              parsedName.firstName,
              parsedName.paternalSurname || 'X',
              parsedName.maternalSurname || 'X',
              row.curp
            );
          } catch (error) {
            // Fallback to standard generation if CURP extraction fails
            generatedRfc = generateRFC(personData);
          }
        } else {
          // Standard RFC generation
          generatedRfc = generateRFC(personData);
        }

        result.generated_curp = generatedCurp;
        result.rfc = generatedRfc;
        result.error = '';
        
        // Add debugging info for name parsing quality
        if (row.curp) {
          const hints = extractNameHintsFromCURP(row.curp);
          if (hints) {
            result.name_validation = validateNameAgainstCURP(
              parsedName.firstName,
              parsedName.paternalSurname,
              parsedName.maternalSurname,
              row.curp
            ) ? 'VALIDATED' : 'WARNING';
          }
        }

        results.push(result);
      } catch (error) {
        results.push({
          ...Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value || ''])
          ),
          generated_curp: '',
          rfc: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

