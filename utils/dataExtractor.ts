// Data extraction utilities for NSS and CURP

export interface ExtractedData {
  birthDate: string; // Format: YYMMDD
  sex?: string; // H or M
  state?: string; // Two letter state code
}

// Mexican state codes mapping
export const STATE_CODES: { [key: string]: string } = {
  'AS': 'Aguascalientes',
  'BC': 'Baja California',
  'BS': 'Baja California Sur',
  'CC': 'Campeche',
  'CL': 'Coahuila',
  'CM': 'Colima',
  'CS': 'Chiapas',
  'CH': 'Chihuahua',
  'DF': 'Ciudad de México',
  'DG': 'Durango',
  'GT': 'Guanajuato',
  'GR': 'Guerrero',
  'HG': 'Hidalgo',
  'JC': 'Jalisco',
  'MC': 'México',
  'MN': 'Michoacán',
  'MS': 'Morelos',
  'NT': 'Nayarit',
  'NL': 'Nuevo León',
  'OC': 'Oaxaca',
  'PL': 'Puebla',
  'QT': 'Querétaro',
  'QR': 'Quintana Roo',
  'SP': 'San Luis Potosí',
  'SL': 'Sinaloa',
  'SR': 'Sonora',
  'TC': 'Tabasco',
  'TS': 'Tamaulipas',
  'TL': 'Tlaxcala',
  'VZ': 'Veracruz',
  'YN': 'Yucatán',
  'ZS': 'Zacatecas',
  'NE': 'Nacido en el Extranjero'
};

// Reverse mapping: State name to code
const STATE_NAME_TO_CODE: { [key: string]: string } = {
  'aguascalientes': 'AS',
  'baja california': 'BC',
  'baja california sur': 'BS',
  'campeche': 'CC',
  'coahuila': 'CL',
  'colima': 'CM',
  'chiapas': 'CS',
  'chihuahua': 'CH',
  'ciudad de méxico': 'DF',
  'ciudad de mexico': 'DF',
  'cdmx': 'DF',
  'df': 'DF',
  'durango': 'DG',
  'guanajuato': 'GT',
  'guerrero': 'GR',
  'hidalgo': 'HG',
  'jalisco': 'JC',
  'méxico': 'MC',
  'mexico': 'MC',
  'estado de méxico': 'MC',
  'estado de mexico': 'MC',
  'michoacán': 'MN',
  'michoacan': 'MN',
  'morelos': 'MS',
  'nayarit': 'NT',
  'nuevo león': 'NL',
  'nuevo leon': 'NL',
  'oaxaca': 'OC',
  'puebla': 'PL',
  'querétaro': 'QT',
  'queretaro': 'QT',
  'quintana roo': 'QR',
  'san luis potosí': 'SP',
  'san luis potosi': 'SP',
  'sinaloa': 'SL',
  'sonora': 'SR',
  'tabasco': 'TC',
  'tamaulipas': 'TS',
  'tlaxcala': 'TL',
  'veracruz': 'VZ',
  'yucatán': 'YN',
  'yucatan': 'YN',
  'zacatecas': 'ZS',
  'nacido en el extranjero': 'NE',
  'extranjero': 'NE'
};

/**
 * Convert state name to state code
 * Handles full state names (e.g., "Veracruz" -> "VZ")
 * Returns the code if already a valid code
 * Case-insensitive and accent-insensitive
 */
export function convertStateToCode(stateInput: string): string | null {
  if (!stateInput) {
    return null;
  }

  const normalized = stateInput.trim().toLowerCase();

  // First check if it's already a valid code
  if (normalized.length === 2) {
    const upperCode = normalized.toUpperCase();
    if (upperCode in STATE_CODES) {
      return upperCode;
    }
  }

  // Try to find it in the name-to-code mapping
  if (normalized in STATE_NAME_TO_CODE) {
    return STATE_NAME_TO_CODE[normalized];
  }

  // Try partial matches (e.g., "Baja California" matches "baja california")
  for (const [name, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      return code;
    }
  }

  return null;
}

/**
 * Validate if a state code is valid
 */
export function isValidStateCode(code: string): boolean {
  return code.toUpperCase() in STATE_CODES;
}

/**
 * Extract birth date from NSS (Número de Seguridad Social)
 * NSS Format: 11 digits
 * Positions 5-6: Last two digits of birth year (YY)
 * Positions 7-8: Month (MM)
 * Positions 9-10: Day (DD)
 * Example: 12345678901 where 67 = year, 89 = month, 01 = day
 */
export function extractBirthDateFromNSS(nss: string): string | null {
  if (!nss || nss.length < 10) {
    return null;
  }

  try {
    // Extract digits 5-10 (index 4-9)
    const year = nss.substring(4, 6);
    const month = nss.substring(6, 8);
    const day = nss.substring(8, 10);

    // Basic validation
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return null;
    }

    if (monthNum < 1 || monthNum > 12) {
      return null;
    }

    if (dayNum < 1 || dayNum > 31) {
      return null;
    }

    return year + month + day;
  } catch (error) {
    return null;
  }
}

/**
 * Extract data from CURP (Clave Única de Registro de Población)
 * CURP Format: 18 characters
 * Positions 4-9: Birth date (YYMMDD)
 * Position 10: Sex (H = Male, M = Female)
 * Positions 11-12: State code
 * Example: AAAA910503HVZRRG09
 *          0123456789...
 */
export function extractDataFromCURP(curp: string): ExtractedData | null {
  if (!curp || curp.length < 12) {
    return null;
  }

  try {
    const birthDate = curp.substring(4, 10); // YYMMDD
    const sex = curp.substring(10, 11).toUpperCase(); // H or M
    const state = curp.substring(11, 13).toUpperCase(); // State code

    // Validate birth date
    const year = birthDate.substring(0, 2);
    const month = birthDate.substring(2, 4);
    const day = birthDate.substring(4, 6);

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return null;
    }

    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return null;
    }

    // Validate sex
    if (sex !== 'H' && sex !== 'M') {
      return null;
    }

    // Validate state code
    if (!isValidStateCode(state)) {
      return null;
    }

    return {
      birthDate,
      sex,
      state
    };
  } catch (error) {
    return null;
  }
}

/**
 * Extract birth date with preference for CURP over NSS
 * Returns birth date in YYMMDD format
 */
export function extractBirthDate(curp?: string, nss?: string): string | null {
  // Try CURP first (more reliable)
  if (curp) {
    const curpData = extractDataFromCURP(curp);
    if (curpData?.birthDate) {
      return curpData.birthDate;
    }
  }

  // Fallback to NSS
  if (nss) {
    return extractBirthDateFromNSS(nss);
  }

  return null;
}

/**
 * Convert YYMMDD to a full date string for display
 */
export function formatBirthDate(birthDate: string): string {
  if (birthDate.length !== 6) {
    return birthDate;
  }

  const year = parseInt(birthDate.substring(0, 2));
  const month = birthDate.substring(2, 4);
  const day = birthDate.substring(4, 6);

  // Determine century (assume < 30 means 2000s, >= 30 means 1900s)
  const fullYear = year < 30 ? 2000 + year : 1900 + year;

  return `${fullYear}-${month}-${day}`;
}

/**
 * CURP Name Hints Interface
 * Extracted structural information from CURP for name validation
 */
export interface CURPNameHints {
  paternalInitial: string;          // Position 0: First letter of paternal surname
  paternalFirstVowel: string;       // Position 1: First internal vowel of paternal surname
  maternalInitial: string;          // Position 2: Initial of maternal surname
  firstNameInitial: string;         // Position 3: Initial of first name
  birthYear: string;                // Positions 4-5: Year of birth (YY)
  state: string;                    // Positions 11-12: State code
}

/**
 * Extract name hints from CURP structure
 * CURP Format: AAAA910503HVZRRG09
 *              0123456789...
 * 
 * Position 0: First letter of paternal surname
 * Position 1: First internal vowel of paternal surname  
 * Position 2: Initial of maternal surname
 * Position 3: Initial of first name
 * Positions 4-9: Birth date (YYMMDD)
 * Position 10: Sex (H/M)
 * Positions 11-12: State code
 * 
 * @param curp - CURP string to extract hints from
 * @returns CURPNameHints object or null if invalid
 */
export function extractNameHintsFromCURP(curp: string): CURPNameHints | null {
  if (!curp || curp.length < 13) {
    return null;
  }

  const upperCURP = curp.toUpperCase();

  return {
    paternalInitial: upperCURP[0],
    paternalFirstVowel: upperCURP[1],
    maternalInitial: upperCURP[2],
    firstNameInitial: upperCURP[3],
    birthYear: upperCURP.substring(4, 6),
    state: upperCURP.substring(11, 13)
  };
}

/**
 * Get first internal vowel from a word (excluding first letter)
 * This matches CURP generation logic for paternal surname
 * 
 * @param word - Word to extract vowel from
 * @returns First internal vowel or 'X' if none found
 */
export function getFirstInternalVowel(word: string): string {
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const upper = word.toUpperCase();
  
  // Start from position 1 (skip first letter)
  for (let i = 1; i < upper.length; i++) {
    if (vowels.includes(upper[i])) {
      return upper[i];
    }
  }
  return 'X'; // No internal vowel found
}

/**
 * Validate if parsed name matches CURP structure
 * This is a sophisticated algorithm that ensures name parsing accuracy
 * by comparing parsed components against CURP's encoded name structure
 * 
 * @param firstName - Parsed first name
 * @param paternalSurname - Parsed paternal surname
 * @param maternalSurname - Parsed maternal surname
 * @param curp - CURP string to validate against
 * @returns true if the parsed name components align with CURP hints
 */
export function validateNameAgainstCURP(
  firstName: string,
  paternalSurname: string,
  maternalSurname: string,
  curp: string
): boolean {
  const hints = extractNameHintsFromCURP(curp);
  if (!hints) return false;

  const cleanPaternal = paternalSurname.replace(/\s+/g, ' ').trim().toUpperCase();
  const cleanMaternal = maternalSurname.replace(/\s+/g, ' ').trim().toUpperCase();
  const cleanFirstName = firstName.replace(/\s+/g, ' ').trim().toUpperCase();

  // Validate all components are present
  if (!cleanPaternal || !cleanMaternal || !cleanFirstName) {
    return false;
  }

  // Check paternal surname initial (position 0)
  if (cleanPaternal[0] !== hints.paternalInitial) {
    return false;
  }

  // Check paternal first internal vowel (position 1)
  const paternalVowel = getFirstInternalVowel(cleanPaternal);
  if (paternalVowel !== hints.paternalFirstVowel && hints.paternalFirstVowel !== 'X') {
    return false;
  }

  // Check maternal surname initial (position 2)
  if (cleanMaternal[0] !== hints.maternalInitial && hints.maternalInitial !== 'X') {
    return false;
  }

  // Check first name initial (position 3)
  if (cleanFirstName[0] !== hints.firstNameInitial) {
    return false;
  }

  return true;
}

/**
 * Extract all available data from CURP including name hints
 * This is the comprehensive CURP parser that extracts all encoded information
 * 
 * @param curp - CURP string
 * @returns Combined extracted data and name hints, or null if invalid
 */
export interface CompleteCURPData extends ExtractedData {
  nameHints?: CURPNameHints;
}

export function extractCompleteCURPData(curp: string): CompleteCURPData | null {
  const basicData = extractDataFromCURP(curp);
  if (!basicData) {
    return null;
  }

  const nameHints = extractNameHintsFromCURP(curp);

  return {
    ...basicData,
    nameHints
  };
}

