// RFC and CURP Generation utilities converted from JavaScript

interface PersonData {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string; // Format: YYMMDD
  sex: string; // H or M
  state: string; // Two letter state code
}

// Filter accents from text
function filterAccents(text: string): string {
  return text
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/Á/g, 'A')
    .replace(/É/g, 'E')
    .replace(/Í/g, 'I')
    .replace(/Ó/g, 'O')
    .replace(/Ú/g, 'U');
}

// Remove special particles from names/surnames (matches Java implementation exactly)
function removeSpecialParticles(text: string): string {
  const particles = ['DE', 'LA', 'LAS', 'MC', 'VON', 'DEL', 'LOS', 'Y', 'MAC', 'VAN', 'MI'];
  let result = text.toUpperCase();
  
  for (const particle of particles) {
    // Remove "PARTICLE " (particle followed by space)
    while (result.includes(particle + ' ')) {
      result = result.replace(particle + ' ', '');
    }
    // Remove " PARTICLE" (space followed by particle)
    while (result.includes(' ' + particle)) {
      result = result.replace(' ' + particle, '');
    }
  }

  return result.trim();
}

// Filter first name - remove MARIA, JOSE, MA, MA. from the beginning
function filterFirstName(name: string): string {
  const normalized = name.toUpperCase().trim();
  // Remove MA|MA.|MARIA|JOSE from the beginning only
  return normalized.replace(/^(MA\.?|MARIA|JOSE)\s+/, '').trim();
}

// Build RFC with one surname
function buildRFCOneApellido(nombre: string, apellido: string): string {
  const ape = apellido.toUpperCase().substring(0, Math.min(2, apellido.length)).padEnd(2, 'X');
  const nom = nombre.toUpperCase().substring(0, Math.min(2, nombre.length)).padEnd(2, 'X');
  return ape + nom;
}

// Build RFC with short paternal surname
function buildRFCShortApellido(apPaterno: string, apMaterno: string, nombre: string): string {
  const pat = apPaterno.toUpperCase().substring(0, 1);
  const mat = apMaterno.toUpperCase().substring(0, 1);
  const nom = nombre.toUpperCase().substring(0, Math.min(2, nombre.length)).padEnd(2, 'X');
  return pat + mat + nom;
}

// Build RFC normally
function buildRFC(apPaterno: string, apMaterno: string, nombre: string): string {
  const vowels = 'AEIOU';
  let firstVowel = 'X'; // Default if no vowel found
  
  // Find first vowel after the first character in paternal surname
  for (let i = 1; i < apPaterno.length; i++) {
    if (vowels.includes(apPaterno.toUpperCase().charAt(i))) {
      firstVowel = apPaterno.charAt(i).toUpperCase();
      break;
    }
  }
  
  return apPaterno.substring(0, 1).toUpperCase() + 
         firstVowel + 
         apMaterno.substring(0, 1).toUpperCase() + 
         nombre.substring(0, 1).toUpperCase();
}

// Remove prohibited words from RFC (obfuscate if matches)
function removeProhibitedWords(rfc: string): string {
  const prohibitedWords = [
    'BUEI', 'BUEY', 'CACA', 'CACO', 'CAGA', 'CAGO', 'CAKA', 'CAKO', 'COGE', 'COJA',
    'COJE', 'COJI', 'COJO', 'CULO', 'FETO', 'GUEY', 'JOTO', 'KACA', 'KACO', 'KAGA',
    'KAGO', 'KOGE', 'KOJO', 'KAKA', 'KULO', 'MAME', 'MAMO', 'MEAR', 'MEAS', 'MEON',
    'MION', 'MOCO', 'MULA', 'PEDA', 'PEDO', 'PENE', 'PUTA', 'PUTO', 'QULO', 'RATA', 'RUIN'
  ];
  
  const rfcUpper = rfc.toUpperCase();
  for (const forbidden of prohibitedWords) {
    if (forbidden === rfcUpper) {
      return rfc.substring(0, 3) + 'X';
    }
  }
  
  return rfc;
}

// Calculate homoclave (2-character code) based on full name
function calculateHomoclave(apPaterno: string, apMaterno: string, nombre: string): string {
  // Build full name for homoclave (FirstLastName + SecondLastName + FirstName)
  let rawFullName = `${apPaterno.trim()} ${apMaterno.trim()} ${nombre.trim()}`.toUpperCase();
  
  // Normalize: strip accents but preserve Ñ
  let fullName = filterAccents(rawFullName);
  
  // Remove special characters: - . ' ,
  fullName = fullName.replace(/[\-\.'',]/g, '');
  
  // Add back Ñ if it was in the original (since filterAccents removes it)
  for (let i = 0; i < rawFullName.length; i++) {
    if (rawFullName[i] === 'Ñ' && i < fullName.length) {
      fullName = fullName.substring(0, i) + 'Ñ' + fullName.substring(i + 1);
    }
  }
  
  // Character to number mapping (same as Java implementation)
  const charMap: { [key: string]: string } = {
    ' ': '00', '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', 
    '5': '05', '6': '06', '7': '07', '8': '08', '9': '09', '&': '10',
    'A': '11', 'B': '12', 'C': '13', 'D': '14', 'E': '15', 'F': '16',
    'G': '17', 'H': '18', 'I': '19', 'J': '21', 'K': '22', 'L': '23',
    'M': '24', 'N': '25', 'O': '26', 'P': '27', 'Q': '28', 'R': '29',
    'S': '32', 'T': '33', 'U': '34', 'V': '35', 'W': '36', 'X': '37',
    'Y': '38', 'Z': '39', 'Ñ': '40'
  };
  
  // Map full name to digit string
  let mappedFullName = '0';
  for (let i = 0; i < fullName.length; i++) {
    const char = fullName[i];
    mappedFullName += charMap[char] || '00';
  }
  
  // Sum pairs of digits
  let pairsSum = 0;
  for (let i = 0; i < mappedFullName.length - 1; i++) {
    const num1 = parseInt(mappedFullName.substring(i, i + 2));
    const num2 = parseInt(mappedFullName.substring(i + 1, i + 2));
    pairsSum += num1 * num2;
  }
  
  // Build homoclave
  const lastThreeDigits = pairsSum % 1000;
  const quotient = Math.floor(lastThreeDigits / 34);
  const remainder = lastThreeDigits % 34;
  
  // Homoclave digits (note: 'O' is intentionally missing)
  const homoclaveDigits = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';
  
  return homoclaveDigits.charAt(quotient) + homoclaveDigits.charAt(remainder);
}

// Calculate verification digit for RFC (last digit)
function calculateRFCVerificationDigit(rfc12: string): string {
  const charValues: { [key: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19,
    'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25, 'P': 26, 'Q': 27, 'R': 28, 'S': 29,
    'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36, ' ': 37, 'Ñ': 38
  };
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const char = rfc12.charAt(i);
    const value = charValues[char] || 0;
    sum += value * (13 - i);
  }
  
  const remainder = sum % 11;
  
  if (remainder === 0) {
    return '0';
  } else {
    // Convert to hex: 1-9 stay as is, 10 becomes 'A'
    const digit = 11 - remainder;
    return digit === 10 ? 'A' : digit.toString();
  }
}

// Normalize name (remove accents and special particles)
function normalizeName(name: string): string {
  if (!name) return '';
  const withoutAccents = filterAccents(name);
  return removeSpecialParticles(withoutAccents);
}

// Generate RFC from person data
export function generateRFC(data: PersonData): string {
  // Normalize surnames (remove accents and particles)
  const apPat = normalizeName(data.paternalSurname);
  const apMat = normalizeName(data.maternalSurname);
  
  // Filter first name (remove MARIA, JOSE, MA, MA.)
  const nombreFiltered = filterFirstName(normalizeName(data.firstName));
  
  // Keep original full names for homoclave calculation
  const apPatOrig = normalizeName(data.paternalSurname);
  const apMatOrig = normalizeName(data.maternalSurname);
  const nombreOrig = normalizeName(data.firstName);
  
  let nameCode = '';
  
  // Determine which form to use based on surname conditions
  if (!apPat || apPat.trim().length === 0) {
    // First last name is empty
    nameCode = buildRFCOneApellido(nombreFiltered, apMat);
  } else if (!apMat || apMat.trim().length === 0) {
    // Second last name is empty
    nameCode = buildRFCOneApellido(nombreFiltered, apPat);
  } else if (apPat.length <= 2) {
    // First last name is too short
    nameCode = buildRFCShortApellido(apPat, apMat, nombreFiltered);
  } else {
    // Normal form
    nameCode = buildRFC(apPat, apMat, nombreFiltered);
  }
  
  nameCode = removeProhibitedWords(nameCode);
  
  // Build complete RFC: nameCode (4) + birthDate (6) + homoclave (2) = 12 chars
  const rfc12 = nameCode.toUpperCase() + data.birthDate + calculateHomoclave(apPatOrig, apMatOrig, nombreOrig);
  
  // Add verification digit
  const verificationDigit = calculateRFCVerificationDigit(rfc12);
  
  return rfc12 + verificationDigit;
}

// Adjust composite names - Remove particles for CURP (more extensive than RFC)
function adjustComposite(str: string): string {
  const composites = ['\\bDA\\b', '\\bDAS\\b', '\\bDE\\b', '\\bDEL\\b', '\\bDER\\b', '\\bDI\\b', 
    '\\bDIE\\b', '\\bDD\\b', '\\bEL\\b', '\\bLA\\b', '\\bLOS\\b', '\\bLAS\\b', '\\bLE\\b', 
    '\\bLES\\b', '\\bMAC\\b', '\\bMC\\b', '\\bVAN\\b', '\\bVON\\b', '\\bY\\b'];
  
  let result = str;
  composites.forEach(composite => {
    result = result.replace(new RegExp(composite, 'g'), '');
  });
  
  return result.trim();
}

// Get first internal consonant
function firstInternalConsonant(str: string): string {
  const internal = str.substring(1).replace(/[AEIOU]/gi, '').substring(0, 1).trim();
  return (internal === '' || internal === 'Ñ') ? 'X' : internal;
}

// Filter characters - convert non-alphabetic to X
function filterCharacters(str: string): string {
  return str.toUpperCase().replace(/[\d_\-./\\,]/g, 'X');
}

// Get name to use (skip common prefixes if multiple names)
function getNameToUse(nombre: string): string {
  const commonPrefixes = ['MARIA DEL ', 'MARIA DE LOS ', 'MARIA ', 'JOSE DE ', 'JOSE ', 
    'MA. ', 'MA ', 'M. ', 'J. ', 'J ', 'M '];
  
  const nombres = nombre.trim().split(/\s+/);
  if (nombres.length === 1) return nombres[0];
  
  // Check if starts with common prefix
  const hasCommonPrefix = commonPrefixes.some(prefix => nombre.indexOf(prefix) === 0);
  
  if (hasCommonPrefix) return nombres[nombres.length > 1 ? 1 : 0];
  return nombres[0];
}

// Bad words dictionary for CURP (more extensive)
const CURP_BAD_WORDS: { [key: string]: string } = {
  'BACA': 'BXCA', 'BAKA': 'BXKA', 'BUEI': 'BXEI', 'BUEY': 'BXEY',
  'CACA': 'CXCA', 'CACO': 'CXCO', 'CAGA': 'CXGA', 'CAGO': 'CXGO',
  'CAKA': 'CXKA', 'CAKO': 'CXKO', 'COGE': 'CXGE', 'COGI': 'CXGI',
  'COJA': 'CXJA', 'COJE': 'CXJE', 'COJI': 'CXJI', 'COJO': 'CXJO',
  'COLA': 'CXLA', 'CULO': 'CXLO', 'FALO': 'FXLO', 'FETO': 'FXTO',
  'GETA': 'GXTA', 'GUEI': 'GXEI', 'GUEY': 'GXEY', 'JETA': 'JXTA',
  'JOTO': 'JXTO', 'KACA': 'KXCA', 'KACO': 'KXCO', 'KAGA': 'KXGA',
  'KAGO': 'KXGO', 'KAKA': 'KXKA', 'KAKO': 'KXKO', 'KOGE': 'KXGE',
  'KOGI': 'KXGI', 'KOJA': 'KXJA', 'KOJE': 'KXJE', 'KOJI': 'KXJI',
  'KOJO': 'KXJO', 'KOLA': 'KXLA', 'KULO': 'KXLO', 'LILO': 'LXLO',
  'LOCA': 'LXCA', 'LOCO': 'LXCO', 'LOKA': 'LXKA', 'LOKO': 'LXKO',
  'MAME': 'MXME', 'MAMO': 'MXMO', 'MEAR': 'MXAR', 'MEAS': 'MXAS',
  'MEON': 'MXON', 'MIAR': 'MXAR', 'MION': 'MXON', 'MOCO': 'MXCO',
  'MOKO': 'MXKO', 'MULA': 'MXLA', 'MULO': 'MXLO', 'NACA': 'NXCA',
  'NACO': 'NXCO', 'PEDA': 'PXDA', 'PEDO': 'PXDO', 'PENE': 'PXNE',
  'PIPI': 'PXPI', 'PITO': 'PXTO', 'POPO': 'PXPO', 'PUTA': 'PXTA',
  'PUTO': 'PXTO', 'QULO': 'QXLO', 'RATA': 'RXTA', 'ROBA': 'RXBA',
  'ROBE': 'RXBE', 'ROBO': 'RXBO', 'RUIN': 'RXIN', 'SENO': 'SXNO',
  'TETA': 'TXTA', 'VACA': 'VXCA', 'VAGA': 'VXGA', 'VAGO': 'VXGO',
  'VAKA': 'VXKA', 'VUEI': 'VXEI', 'VUEY': 'VXEY', 'WUEI': 'WXEI',
  'WUEY': 'WXEY'
};

// Remove bad words from CURP
function removeCURPBadWords(word: string): string {
  return CURP_BAD_WORDS[word] || word;
}

// Get special character based on birth year (position 17)
function getSpecialChar(birthYear: string): string {
  // If year starts with 1 (1900s), use '0', otherwise use 'A' (2000s)
  return birthYear.charAt(0) === '1' ? '0' : 'A';
}

// Add verification digit to CURP
function addCURPVerificationDigit(incompleteCurp: string): number {
  const dictionary = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  let sum = 0;
  
  for (let i = 0; i < 17; i++) {
    sum += dictionary.indexOf(incompleteCurp.charAt(i)) * (18 - i);
  }
  
  let digit = 10 - (sum % 10);
  if (digit === 10) return 0;
  return digit;
}

// Generate CURP from person data
export function generateCURP(data: PersonData): string {
  // Normalize and adjust names
  const nombre = adjustComposite(filterAccents(data.firstName.toUpperCase())).trim();
  const apellidoPaterno = adjustComposite(filterAccents(data.paternalSurname.toUpperCase())).trim();
  let apellidoMaterno = data.maternalSurname || '';
  apellidoMaterno = adjustComposite(filterAccents(apellidoMaterno.toUpperCase())).trim();
  
  // Get name to use (handles common prefixes)
  const nombreUsar = getNameToUse(nombre);
  const inicialNombre = nombreUsar.substring(0, 1);
  
  // Get first internal vowel from paternal surname
  let vocalApellido = apellidoPaterno
    .substring(1)
    .replace(/[BCDFGHJKLMNÑPQRSTVWXYZ]/g, '')
    .substring(0, 1)
    .trim();
  vocalApellido = vocalApellido === '' ? 'X' : vocalApellido;
  
  // First letter of paternal surname
  let primeraLetraPaterno = apellidoPaterno.substring(0, 1);
  primeraLetraPaterno = primeraLetraPaterno === 'Ñ' ? 'X' : primeraLetraPaterno;
  
  // First letter of maternal surname
  let primeraLetraMaterno = '';
  if (!apellidoMaterno || apellidoMaterno === '') {
    primeraLetraMaterno = 'X';
  } else {
    primeraLetraMaterno = apellidoMaterno.substring(0, 1);
    primeraLetraMaterno = primeraLetraMaterno === 'Ñ' ? 'X' : primeraLetraMaterno;
  }
  
  // Build positions 1-4
  let posicion1_4 = [primeraLetraPaterno, vocalApellido, primeraLetraMaterno, inicialNombre].join('');
  posicion1_4 = removeCURPBadWords(filterCharacters(posicion1_4));
  
  // Build positions 14-16 (internal consonants)
  const posicion14_16 = [
    firstInternalConsonant(apellidoPaterno),
    firstInternalConsonant(apellidoMaterno),
    firstInternalConsonant(nombreUsar)
  ].join('');
  
  // Parse birth date (expected format: YYMMDD)
  const year = data.birthDate.substring(0, 2);
  const month = data.birthDate.substring(2, 4);
  const day = data.birthDate.substring(4, 6);
  
  // Build CURP (positions 1-17)
  let curp = [
    posicion1_4,
    year,
    month,
    day,
    data.sex.toUpperCase(),
    data.state.toUpperCase(),
    filterCharacters(posicion14_16)
  ].join('');
  
  // Add special character (position 17)
  // Determine full year to check century
  const fullYear = parseInt(year) < 30 ? '20' + year : '19' + year;
  curp += getSpecialChar(fullYear);
  
  // Add verification digit
  curp += addCURPVerificationDigit(curp);
  
  return curp;
}

/**
 * Generate RFC from name and CURP
 * Simplified RFC generation that extracts required data from CURP
 * This is more efficient when you already have a valid CURP
 * 
 * @param firstName - First name
 * @param paternalSurname - Paternal surname
 * @param maternalSurname - Maternal surname
 * @param curp - Valid CURP string
 * @returns Generated RFC
 */
export function generateRFCFromCURP(
  firstName: string,
  paternalSurname: string,
  maternalSurname: string,
  curp: string
): string {
  if (!curp || curp.length < 13) {
    throw new Error('Invalid CURP provided');
  }

  // Extract birth date from CURP (positions 4-9: YYMMDD)
  const birthDate = curp.substring(4, 10);
  
  // Extract state from CURP (positions 11-12)
  const state = curp.substring(11, 13);
  
  // Extract sex from CURP (position 10: H or M)
  const sex = curp.substring(10, 11);

  // Generate RFC using extracted data
  return generateRFC({
    firstName,
    paternalSurname,
    maternalSurname,
    birthDate,
    sex,
    state
  });
}

/**
 * Generate both RFC and CURP from name and existing CURP
 * This is useful when you want to regenerate both identifiers
 * and ensure consistency between them
 * 
 * @param firstName - First name
 * @param paternalSurname - Paternal surname
 * @param maternalSurname - Maternal surname
 * @param curp - Valid CURP string for data extraction
 * @returns Object with both RFC and CURP
 */
export function generateRFCAndCURPFromExisting(
  firstName: string,
  paternalSurname: string,
  maternalSurname: string,
  curp: string
): { rfc: string; curp: string } {
  if (!curp || curp.length < 13) {
    throw new Error('Invalid CURP provided');
  }

  // Extract all data from CURP
  const birthDate = curp.substring(4, 10); // YYMMDD
  const sex = curp.substring(10, 11);      // H or M
  const state = curp.substring(11, 13);    // State code

  const personData: PersonData = {
    firstName,
    paternalSurname,
    maternalSurname,
    birthDate,
    sex,
    state
  };

  return {
    rfc: generateRFC(personData),
    curp: generateCURP(personData)
  };
}

