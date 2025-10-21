// Mexican name parser utility

export interface ParsedName {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
}

// Common Mexican compound first names
const COMPOUND_FIRST_NAMES = [
  'JOSE MARIA', 'MARIA JOSE', 'JUAN CARLOS', 'JOSE LUIS', 'MARIA GUADALUPE',
  'MARIA DEL CARMEN', 'ANA MARIA', 'MARIA ELENA', 'JOSE ANTONIO', 'MARIA TERESA',
  'LUIS FERNANDO', 'CARLOS ALBERTO', 'MARIA ISABEL', 'JOSE MANUEL', 'JUAN MANUEL'
];

// Common surname particles
const SURNAME_PARTICLES = ['DE', 'DEL', 'DE LA', 'DE LAS', 'DE LOS', 'LOS', 'LAS', 'LA', 'VAN', 'VON', 'MC', 'MAC', 'Y'];

/**
 * Parse a full Mexican name into components
 * Expected format: "FirstName(s) PaternalSurname MaternalSurname"
 * 
 * Rules:
 * - 1 word: First name only
 * - 2 words: First name + Paternal surname
 * - 3 words: First name + Paternal surname + Maternal surname
 * - 4 words: First two words are first name, 3rd is paternal, 4th is maternal
 * - 5+ words: Use compound name detection or simple parsing
 */
export function parseFullName(fullName: string): ParsedName {
  // Normalize the name
  const normalized = fullName.toUpperCase().trim().replace(/\s+/g, ' ');
  
  if (!normalized) {
    return {
      firstName: '',
      paternalSurname: '',
      maternalSurname: ''
    };
  }
  
  const words = normalized.split(' ');
  
  if (words.length === 1) {
    // Only one word - treat as first name
    return {
      firstName: words[0],
      paternalSurname: '',
      maternalSurname: ''
    };
  }
  
  if (words.length === 2) {
    // Two words - first name and paternal surname
    return {
      firstName: words[0],
      paternalSurname: words[1],
      maternalSurname: ''
    };
  }
  
  if (words.length === 3) {
    // Three words - first name, paternal, maternal
    return {
      firstName: words[0],
      paternalSurname: words[1],
      maternalSurname: words[2]
    };
  }
  
  if (words.length === 4) {
    // Four words - first two are first name (compound), 3rd is paternal, 4th is maternal
    return {
      firstName: words[0] + ' ' + words[1],
      paternalSurname: words[2],
      maternalSurname: words[3]
    };
  }
  
  // 5+ words - check for known compound first names, otherwise use simple logic
  for (const compound of COMPOUND_FIRST_NAMES) {
    const compoundWords = compound.split(' ');
    if (words.length >= compoundWords.length + 2) {
      const potentialCompound = words.slice(0, compoundWords.length).join(' ');
      if (potentialCompound === compound) {
        // Found compound name
        return {
          firstName: compound,
          paternalSurname: words[compoundWords.length],
          maternalSurname: words[compoundWords.length + 1]
        };
      }
    }
  }
  
  // Fallback for 5+ words without known compound:
  // Check if any word is a particle, use it to split surnames
  let surnameStartIndex = 1; // Default: everything after first word
  
  for (let i = 1; i < words.length - 1; i++) {
    if (SURNAME_PARTICLES.includes(words[i])) {
      surnameStartIndex = i;
      break;
    }
  }
  
  // If found particle, use it; otherwise split at halfway point
  if (surnameStartIndex === 1 && words.length > 3) {
    // No particle found, assume first half is first name
    surnameStartIndex = Math.floor(words.length / 2);
  }
  
  const firstName = words.slice(0, surnameStartIndex).join(' ');
  const remainingWords = words.slice(surnameStartIndex);
  
  if (remainingWords.length === 1) {
    return {
      firstName,
      paternalSurname: remainingWords[0],
      maternalSurname: ''
    };
  }
  
  // Split remaining words in half for paternal/maternal
  const midPoint = Math.floor(remainingWords.length / 2);
  
  return {
    firstName,
    paternalSurname: remainingWords.slice(0, midPoint).join(' '),
    maternalSurname: remainingWords.slice(midPoint).join(' ')
  };
}

/**
 * Simple name parser for common 3-part names: "FirstName PaternalSurname MaternalSurname"
 */
export function parseSimpleName(fullName: string): ParsedName {
  const normalized = fullName.toUpperCase().trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  
  if (words.length >= 3) {
    // Last word is maternal, second to last is paternal, rest is first name
    const maternalSurname = words[words.length - 1];
    const paternalSurname = words[words.length - 2];
    const firstName = words.slice(0, words.length - 2).join(' ');
    
    return {
      firstName,
      paternalSurname,
      maternalSurname
    };
  }
  
  // Fallback to basic parsing
  return parseFullName(fullName);
}

/**
 * Sophisticated name parser with CURP validation
 * Uses CURP structure to verify and improve parsing accuracy
 * This algorithm tries multiple parsing strategies and validates each against CURP
 * 
 * @param fullName - Full name to parse
 * @param curp - Optional CURP for validation
 * @param validateFn - Optional validation function (injected to avoid circular dependency)
 * @returns Parsed name components
 */
export function parseNameWithCURP(
  fullName: string,
  curp?: string,
  validateFn?: (firstName: string, paternalSurname: string, maternalSurname: string, curp: string) => boolean
): ParsedName {
  const normalized = fullName.toUpperCase().trim().replace(/\s+/g, ' ');
  
  if (!normalized) {
    return { firstName: '', paternalSurname: '', maternalSurname: '' };
  }

  const words = normalized.split(' ');
  
  // If no CURP provided or no validation function, use standard parsing
  if (!curp || !validateFn) {
    return parseFullName(fullName);
  }

  // Define multiple parsing strategies (ordered by likelihood)
  const strategies: Array<() => ParsedName | null> = [
    // Strategy 1: Standard parsing (most common)
    () => parseFullName(fullName),
    
    // Strategy 2: Last 2 words as surnames (common alternative)
    () => {
      if (words.length >= 3) {
        return {
          firstName: words.slice(0, -2).join(' '),
          paternalSurname: words[words.length - 2],
          maternalSurname: words[words.length - 1]
        };
      }
      return null;
    },
    
    // Strategy 3: First word as first name, rest split for surnames
    () => {
      if (words.length >= 3) {
        const midPoint = 1 + Math.floor((words.length - 1) / 2);
        return {
          firstName: words[0],
          paternalSurname: words.slice(1, midPoint).join(' '),
          maternalSurname: words.slice(midPoint).join(' ')
        };
      }
      return null;
    },
    
    // Strategy 4: First 2 words as first name (for compound names)
    () => {
      if (words.length >= 4) {
        const midPoint = 2 + Math.floor((words.length - 2) / 2);
        return {
          firstName: words.slice(0, 2).join(' '),
          paternalSurname: words.slice(2, midPoint).join(' '),
          maternalSurname: words.slice(midPoint).join(' ')
        };
      }
      return null;
    },
    
    // Strategy 5: Smart split based on word count
    () => {
      if (words.length >= 5) {
        // For 5+ words, try splitting more evenly
        const firstNameWords = Math.ceil(words.length / 3);
        const paternalWords = Math.floor((words.length - firstNameWords) / 2);
        
        return {
          firstName: words.slice(0, firstNameWords).join(' '),
          paternalSurname: words.slice(firstNameWords, firstNameWords + paternalWords).join(' '),
          maternalSurname: words.slice(firstNameWords + paternalWords).join(' ')
        };
      }
      return null;
    }
  ];

  // Try each strategy and return the first one that validates against CURP
  for (const strategy of strategies) {
    const result = strategy();
    if (result && result.firstName && result.paternalSurname && result.maternalSurname) {
      if (validateFn(result.firstName, result.paternalSurname, result.maternalSurname, curp)) {
        return result;
      }
    }
  }

  // If no strategy validates, return standard parsing
  // (the name might be incorrect in the input, or CURP might not match)
  return parseFullName(fullName);
}

/**
 * Extract name components directly from CURP hints
 * This is a reverse-engineering approach that attempts to reconstruct
 * the name from CURP structure when full name parsing is ambiguous
 * 
 * @param fullName - Full name string
 * @param curp - CURP string
 * @returns Best-guess parsed name based on CURP hints
 */
export function parseNameFromCURPHints(fullName: string, curp: string): ParsedName {
  const normalized = fullName.toUpperCase().trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  
  if (words.length < 3 || !curp || curp.length < 4) {
    return parseFullName(fullName);
  }

  const paternalInitial = curp[0];
  const maternalInitial = curp[2];
  const firstNameInitial = curp[3];

  // Find words that match each initial
  const paternalCandidates = words.filter(w => w[0] === paternalInitial);
  const maternalCandidates = words.filter(w => w[0] === maternalInitial);
  const firstNameCandidates = words.filter(w => w[0] === firstNameInitial);

  // Sophisticated matching algorithm
  if (paternalCandidates.length > 0 && maternalCandidates.length > 0 && firstNameCandidates.length > 0) {
    // Assume surnames typically come after first name
    const paternalIndex = words.indexOf(paternalCandidates[0]);
    const maternalIndex = words.indexOf(maternalCandidates[maternalCandidates.length - 1]);
    const firstNameIndex = words.indexOf(firstNameCandidates[0]);

    if (firstNameIndex < paternalIndex && paternalIndex < maternalIndex) {
      return {
        firstName: words.slice(firstNameIndex, paternalIndex).join(' '),
        paternalSurname: words.slice(paternalIndex, maternalIndex).join(' '),
        maternalSurname: words.slice(maternalIndex).join(' ')
      };
    }
  }

  // Fallback to standard parsing
  return parseFullName(fullName);
}

