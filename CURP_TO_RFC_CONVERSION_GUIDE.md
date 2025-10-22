# CURP to RFC Conversion Logic - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Understanding CURP Structure](#understanding-curp-structure)
3. [Understanding RFC Structure](#understanding-rfc-structure)
4. [Conversion Process](#conversion-process)
5. [Step-by-Step Algorithm](#step-by-step-algorithm)
6. [Name Processing Rules](#name-processing-rules)
7. [Special Cases](#special-cases)
8. [Complete Examples](#complete-examples)
9. [Implementation Functions](#implementation-functions)

---

## Overview

This document explains the complete process of converting a **CURP** (Clave Única de Registro de Población) to an **RFC** (Registro Federal de Contribuyentes), both Mexican government identification codes.

### Key Concept
The CURP contains all the necessary information to generate an RFC:
- **CURP** is 18 characters
- **RFC** is 13 characters
- The RFC can be extracted/generated from CURP + full name

---

## Understanding CURP Structure

### CURP Format (18 Characters)

```
Position  | Content                        | Example
----------|--------------------------------|----------
1-4       | Name Code                      | GALJ
5-6       | Birth Year (YY)                | 85
7-8       | Birth Month (MM)               | 06
9-10      | Birth Day (DD)                 | 15
11        | Sex (H/M/X)                    | M
12-13     | State Code                     | DF
14-16     | Internal Consonants            | RPS
17        | Century Indicator              | 0
18        | Verification Digit             | 9
```

**Complete Example:** `GALJ850615MDFRPS09`

### Breaking Down Each Component

#### 1. Name Code (Positions 1-4)
- **Position 1:** First letter of paternal surname
- **Position 2:** First internal vowel of paternal surname (after first letter)
- **Position 3:** First letter of maternal surname (X if missing)
- **Position 4:** First letter of first name (after filtering MARIA/JOSE)

#### 2. Birth Date (Positions 5-10)
- **Format:** YYMMDD
- **Example:** 850615 = June 15, 1985

#### 3. Sex (Position 11)
- **H:** Hombre (Male)
- **M:** Mujer (Female)
- **X:** Not specified

#### 4. State Code (Positions 12-13)
- Two-letter code for Mexican state
- Examples: DF, BC, NL, JL, etc.

#### 5. Internal Consonants (Positions 14-16)
- **Position 14:** First internal consonant of paternal surname
- **Position 15:** First internal consonant of maternal surname  
- **Position 16:** First internal consonant of first name

#### 6. Century Indicator (Position 17)
- **0:** Born in 1900s
- **A:** Born in 2000s

#### 7. Verification Digit (Position 18)
- Calculated checksum (0-9)

---

## Understanding RFC Structure

### RFC Format (13 Characters)

```
Position  | Content                        | Example
----------|--------------------------------|----------
1-4       | Name Code                      | AOCM
5-6       | Birth Year (YY)                | 91
7-8       | Birth Month (MM)               | 05
9-10      | Birth Day (DD)                 | 03
11-12     | Homoclave                      | XY
13        | Verification Digit             | 9
```

**Complete Example:** `AOCM910503XY9`

### Breaking Down Each Component

#### 1. Name Code (Positions 1-4) - DIFFERENT FROM CURP
Built using a different algorithm:
- **Position 1:** First letter of paternal surname
- **Position 2:** First internal VOWEL of paternal surname
- **Position 3:** First letter of maternal surname
- **Position 4:** First letter of first name

**Key Difference:** Position 2 is the first VOWEL (not just vowel in CURP)

#### 2. Birth Date (Positions 5-10)
- Same as CURP: YYMMDD

#### 3. Homoclave (Positions 11-12)
- Complex calculation based on full name
- Unique 2-character code
- Uses character mapping and mathematical formula

#### 4. Verification Digit (Position 13)
- Calculated checksum (0-9 or A)

---

## Conversion Process

### High-Level Flow

```
Input: CURP + Full Name
        ↓
Extract Data from CURP:
  - Birth Date (positions 5-10)
  - Sex (position 11)
  - State (positions 12-13)
        ↓
Parse Full Name:
  - First Name
  - Paternal Surname
  - Maternal Surname
        ↓
Generate RFC:
  1. Build Name Code (4 chars)
  2. Add Birth Date (6 chars)
  3. Calculate Homoclave (2 chars)
  4. Calculate Verification Digit (1 char)
        ↓
Output: RFC (13 characters)
```

---

## Step-by-Step Algorithm

### Step 1: Extract Data from CURP

```typescript
function extractDataFromCURP(curp: string) {
  return {
    birthDate: curp.substring(4, 10),  // Positions 5-10: YYMMDD
    sex: curp.substring(10, 11),       // Position 11: H or M
    state: curp.substring(11, 13)      // Positions 12-13: State code
  };
}
```

**Example:**
- CURP: `GALJ850615MDFRPS09`
- Birth Date: `850615`
- Sex: `M`
- State: `DF`

---

### Step 2: Parse Full Name

The name must be separated into three components:

```typescript
interface ParsedName {
  firstName: string;        // "JOSE" or "MARIA JOSE"
  paternalSurname: string;  // "GARCIA"
  maternalSurname: string;  // "LOPEZ"
}
```

**Parsing Rules:**
1. Names are typically in format: `FirstName PaternalSurname MaternalSurname`
2. Handle compound names: "JOSE MARIA", "MARIA DEL CARMEN"
3. Handle particles: "DE LA", "DEL", "VON", etc.

---

### Step 3: Normalize Names

#### A. Remove Accents

```typescript
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
```

**Example:** "JOSÉ" → "JOSE"

#### B. Remove Special Particles

Particles removed from surnames (for RFC):
```
DE, LA, LAS, MC, VON, DEL, LOS, Y, MAC, VAN, MI
```

```typescript
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
```

**Example:** "DE LA CRUZ" → "CRUZ"

#### C. Filter First Name (For Name Code Only)

Remove common prefixes from first name:
```
MA, MA., MARIA, JOSE
```

**Only removed from the BEGINNING of the name**

```typescript
function filterFirstName(name: string): string {
  const normalized = name.toUpperCase().trim();
  return normalized.replace(/^(MA\.?|MARIA|JOSE)\s+/, '').trim();
}
```

**Examples:**
- "MARIA JOSE" → "JOSE"
- "JOSE LUIS" → "LUIS"
- "MARIA" (single name) → "MARIA" (not removed if it's the only name)

---

### Step 4: Build RFC Name Code (4 Characters)

#### Normal Form (Standard Case)

```typescript
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
  
  return apPaterno.substring(0, 1).toUpperCase() +  // 1st char of paternal
         firstVowel +                                 // 1st vowel of paternal
         apMaterno.substring(0, 1).toUpperCase() +   // 1st char of maternal
         nombre.substring(0, 1).toUpperCase();       // 1st char of first name
}
```

**Example:**
- Paternal: "GARCIA"
- Maternal: "LOPEZ"
- First: "MARIA" → filtered to "MARIA" (kept as single name)
- Result: **G** (first) + **A** (first vowel after G) + **L** + **M** = `GALM`

#### Special Case: One Surname Missing

If either surname is missing:

```typescript
function buildRFCOneApellido(nombre: string, apellido: string): string {
  const ape = apellido.toUpperCase().substring(0, Math.min(2, apellido.length)).padEnd(2, 'X');
  const nom = nombre.toUpperCase().substring(0, Math.min(2, nombre.length)).padEnd(2, 'X');
  return ape + nom;
}
```

**Example:**
- If maternal surname missing: Paternal "GARCIA", First "JOSE"
- Result: **GA** + **JO** = `GAJO`

#### Special Case: Short Paternal Surname (≤2 characters)

```typescript
function buildRFCShortApellido(apPaterno: string, apMaterno: string, nombre: string): string {
  const pat = apPaterno.toUpperCase().substring(0, 1);
  const mat = apMaterno.toUpperCase().substring(0, 1);
  const nom = nombre.toUpperCase().substring(0, Math.min(2, nombre.length)).padEnd(2, 'X');
  return pat + mat + nom;
}
```

**Example:**
- Paternal: "WU" (only 2 chars)
- Maternal: "LOPEZ"
- First: "JOSE"
- Result: **W** + **L** + **JO** = `WLJO`

---

### Step 5: Check Prohibited Words

If the 4-character name code matches any prohibited word, replace the 4th character with 'X'.

**Complete List (40 words):**
```
BUEI, BUEY, CACA, CACO, CAGA, CAGO, CAKA, CAKO, COGE, COJA,
COJE, COJI, COJO, CULO, FETO, GUEY, JOTO, KACA, KACO, KAGA,
KAGO, KOGE, KOJO, KAKA, KULO, MAME, MAMO, MEAR, MEAS, MEON,
MION, MOCO, MULA, PEDA, PEDO, PENE, PUTA, PUTO, QULO, RATA, RUIN
```

```typescript
function removeProhibitedWords(rfc: string): string {
  const prohibitedWords = [ /* list above */ ];
  
  const rfcUpper = rfc.toUpperCase();
  for (const forbidden of prohibitedWords) {
    if (forbidden === rfcUpper) {
      return rfc.substring(0, 3) + 'X';  // Replace 4th character
    }
  }
  
  return rfc;
}
```

**Example:**
- If name code is "CACA" → becomes "CACX"

---

### Step 6: Add Birth Date

Simply append the 6-character birth date from CURP:

```typescript
const rfc = nameCode + birthDate;  // Now 10 characters
```

**Example:**
- Name Code: `GALM`
- Birth Date: `850615`
- Result: `GALM850615`

---

### Step 7: Calculate Homoclave (2 Characters)

This is the most complex part of RFC generation.

#### A. Build Full Name for Homoclave

```typescript
let rawFullName = `${apPaterno} ${apMaterno} ${nombre}`.toUpperCase();
```

**Important:** Use the ORIGINAL names (NOT filtered):
- Don't remove MARIA/JOSE for homoclave
- Keep accents removed and particles removed

**Example:**
- Paternal: "GARCIA"
- Maternal: "LOPEZ"
- First: "MARIA JOSE" (ORIGINAL, not filtered)
- Full Name: `GARCIA LOPEZ MARIA JOSE`

#### B. Normalize Full Name

```typescript
// 1. Strip accents
let fullName = filterAccents(rawFullName);

// 2. Remove special characters: - . ' ,
fullName = fullName.replace(/[\-\.'',]/g, '');

// 3. Restore Ñ (since filterAccents removes it)
for (let i = 0; i < rawFullName.length; i++) {
  if (rawFullName[i] === 'Ñ' && i < fullName.length) {
    fullName = fullName.substring(0, i) + 'Ñ' + fullName.substring(i + 1);
  }
}
```

#### C. Map Characters to Numbers

Each character gets a 2-digit code:

```typescript
const charMap = {
  ' ': '00', '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', 
  '5': '05', '6': '06', '7': '07', '8': '08', '9': '09', '&': '10',
  'A': '11', 'B': '12', 'C': '13', 'D': '14', 'E': '15', 'F': '16',
  'G': '17', 'H': '18', 'I': '19', 'J': '21', 'K': '22', 'L': '23',
  'M': '24', 'N': '25', 'O': '26', 'P': '27', 'Q': '28', 'R': '29',
  'S': '32', 'T': '33', 'U': '34', 'V': '35', 'W': '36', 'X': '37',
  'Y': '38', 'Z': '39', 'Ñ': '40'
};
```

**Note:** 
- I=19, then J=21 (20 is skipped)
- S=32 (31 is skipped)

**Map full name to digit string:**

```typescript
let mappedFullName = '0';  // Start with '0'
for (let i = 0; i < fullName.length; i++) {
  const char = fullName[i];
  mappedFullName += charMap[char] || '00';
}
```

**Example:**
- Full Name: `GARCIA LOPEZ`
- G → 17
- A → 11
- R → 29
- C → 13
- I → 19
- A → 11
- (space) → 00
- L → 23
- O → 26
- P → 27
- E → 15
- Z → 39
- Mapped: `017112913191100232627153```

#### D. Calculate Pairs Sum

```typescript
let pairsSum = 0;
for (let i = 0; i < mappedFullName.length - 1; i++) {
  const num1 = parseInt(mappedFullName.substring(i, i + 2));
  const num2 = parseInt(mappedFullName.substring(i + 1, i + 2));
  pairsSum += num1 * num2;
}
```

**Formula:** For each adjacent pair, multiply (2-digit number) × (1-digit number) and sum.

**Example with "01711":**
- Position 0: "01" × "7" = 1 × 7 = 7
- Position 1: "17" × "1" = 17 × 1 = 17
- Position 2: "71" × "1" = 71 × 1 = 71
- Sum: 7 + 17 + 71 = 95 (continues for all positions)

#### E. Convert to Homoclave

```typescript
const lastThreeDigits = pairsSum % 1000;
const quotient = Math.floor(lastThreeDigits / 34);
const remainder = lastThreeDigits % 34;

// Homoclave digits (note: 'O' is intentionally missing - 34 chars)
const homoclaveDigits = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';

const homoclave = homoclaveDigits.charAt(quotient) + homoclaveDigits.charAt(remainder);
```

**Formula:**
1. Take last 3 digits of pairs sum (mod 1000)
2. Divide by 34, get quotient and remainder
3. Map both to homoclave character set

**Example:**
- If pairsSum = 12456
- Last 3 digits: 456
- Quotient: 456 ÷ 34 = 13 (integer division)
- Remainder: 456 % 34 = 14
- Homoclave: homoclaveDigits[13] + homoclaveDigits[14] = "ED"

---

### Step 8: Calculate Verification Digit

Use the 12-character RFC (name code + birth date + homoclave):

```typescript
function calculateRFCVerificationDigit(rfc12: string): string {
  const charValues = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
    'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25, 'P': 26, 'Q': 27,
    'R': 28, 'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36,
    ' ': 37, 'Ñ': 38
  };
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const char = rfc12.charAt(i);
    const value = charValues[char] || 0;
    sum += value * (13 - i);  // Position weight: 13, 12, 11, ..., 2
  }
  
  const remainder = sum % 11;
  
  if (remainder === 0) {
    return '0';
  } else {
    const digit = 11 - remainder;
    return digit === 10 ? 'A' : digit.toString();  // 10 becomes 'A'
  }
}
```

**Formula:**
1. Each character gets a value (0-9 = 0-9, A-Z = 10-36, special chars)
2. Multiply by position weight (13 down to 2)
3. Sum all products
4. Take mod 11
5. Verification digit = 11 - (mod 11), where 10 → 'A'

**Example:**
- RFC12: `GALM850615ED`
- G(16) × 13 + A(10) × 12 + L(21) × 11 + M(22) × 10 + ...
- Sum: (calculation result)
- Remainder: sum % 11
- If remainder = 5, then digit = 11 - 5 = 6

---

### Step 9: Final RFC Assembly

```typescript
const finalRFC = nameCode + birthDate + homoclave + verificationDigit;
```

**Example:**
- Name Code: `GALM`
- Birth Date: `850615`
- Homoclave: `ED`
- Verification: `6`
- **Final RFC:** `GALM850615ED6`

---

## Name Processing Rules

### Rule 1: Accent Removal
All accented characters must be converted:
- á, é, í, ó, ú → a, e, i, o, u

### Rule 2: Particle Removal (Surnames)
Remove these particles from surnames ONLY:
```
DE, LA, LAS, MC, VON, DEL, LOS, Y, MAC, VAN, MI
```

**Examples:**
- "DE LA CRUZ" → "CRUZ"
- "VON SCHMIDT" → "SCHMIDT"
- "MC GREGOR" → "GREGOR"

### Rule 3: Name Filtering (First Name Only for Name Code)
Remove from BEGINNING of first name for name code:
```
MA, MA., MARIA, JOSE
```

**But KEEP for homoclave calculation!**

**Examples:**
- Name Code: "MARIA JOSE" → use "JOSE"
- Homoclave: "MARIA JOSE" → use "MARIA JOSE"

### Rule 4: Ñ Handling
- Remove accents from Ñ → N (in some contexts)
- But preserve Ñ in homoclave calculation
- Replace Ñ with X in CURP first letters

### Rule 5: Empty Surname Handling
- If maternal surname missing → use "X"
- If paternal surname missing → use special one-surname form

---

## Special Cases

### Case 1: Missing Maternal Surname

**Example:**
- Name: "JOSE GARCIA" (no maternal)
- Paternal: "GARCIA"
- Maternal: "" → use "X"
- Result: G + A + X + J = `GAXJ`

### Case 2: Short Paternal Surname

**Example:**
- Name: "LI WANG"
- Paternal: "LI" (only 2 chars)
- Maternal: "WANG"
- Use special form: L + W + first 2 of name

### Case 3: No Vowel in Paternal Surname

**Example:**
- Paternal: "BY"
- No vowel after first letter
- Use "X" as default

### Case 4: Compound First Names

**Examples:**
- "JOSE MARIA" → use "MARIA" for name code
- "MARIA JOSE" → use "JOSE" for name code
- "MARIA" (alone) → use "MARIA" (not removed if single name)

### Case 5: Names with Numbers or Special Characters

Numbers and special characters in names are rare but possible:
- Convert digits to "X" in CURP
- For RFC, they typically shouldn't occur after normalization

---

## Complete Examples

### Example 1: Standard Case

**Input:**
- Full Name: "JOSE LUIS GARCIA LOPEZ"
- CURP: `GALJ850615HDFRRP09`

**Step-by-Step:**

1. **Extract from CURP:**
   - Birth Date: `850615`
   - Sex: `H`
   - State: `DF`

2. **Parse Name:**
   - First: "JOSE LUIS"
   - Paternal: "GARCIA"
   - Maternal: "LOPEZ"

3. **Normalize:**
   - Paternal: "GARCIA" (no changes)
   - Maternal: "LOPEZ" (no changes)
   - First (filtered): "JOSE LUIS" → "LUIS" (JOSE removed)

4. **Build Name Code:**
   - G (first of GARCIA)
   - A (first vowel in GARCIA after G)
   - L (first of LOPEZ)
   - L (first of LUIS)
   - Result: `GALL`

5. **Check Prohibited:** "GALL" → not in list, keep as is

6. **Add Birth Date:** `GALL850615` (10 chars)

7. **Calculate Homoclave:**
   - Full Name: "GARCIA LOPEZ JOSE LUIS" (keep JOSE for homoclave!)
   - Map to digits → calculate pairs → get homoclave
   - Example result: `7A`

8. **Add Verification Digit:**
   - RFC12: `GALL8506157A`
   - Calculate → result: `3`

9. **Final RFC:** `GALL8506157A3`

---

### Example 2: With Particles

**Input:**
- Full Name: "MARIA DE LA CRUZ GONZALEZ"
- CURP: `CXGM900101MDFRNR02`

**Step-by-Step:**

1. **Extract from CURP:**
   - Birth Date: `900101`
   - Sex: `M`
   - State: `DF`

2. **Parse Name:**
   - First: "MARIA"
   - Paternal: "DE LA CRUZ"
   - Maternal: "GONZALEZ"

3. **Normalize:**
   - Paternal: "DE LA CRUZ" → "CRUZ" (particles removed)
   - Maternal: "GONZALEZ"
   - First (filtered): "MARIA" → "MARIA" (single name, keep)

4. **Build Name Code:**
   - C (first of CRUZ)
   - U (first vowel in CRUZ after C)
   - G (first of GONZALEZ)
   - M (first of MARIA)
   - Result: `CUGM`

5. **Check Prohibited:** "CUGM" → not in list

6. **Add Birth Date:** `CUGM900101`

7. **Calculate Homoclave:**
   - Full Name: "CRUZ GONZALEZ MARIA"
   - Calculate → example: `5B`

8. **Add Verification:** Calculate → example: `8`

9. **Final RFC:** `CUGM9001015B8`

---

### Example 3: Compound First Name

**Input:**
- Full Name: "MARIA JOSE RODRIGUEZ MARTINEZ"
- CURP: `ROMJ950315MDFRDR03`

**Step-by-Step:**

1. **Extract from CURP:**
   - Birth Date: `950315`
   - Sex: `M`
   - State: `DF`

2. **Parse Name:**
   - First: "MARIA JOSE"
   - Paternal: "RODRIGUEZ"
   - Maternal: "MARTINEZ"

3. **Normalize:**
   - Paternal: "RODRIGUEZ"
   - Maternal: "MARTINEZ"
   - First (filtered): "MARIA JOSE" → "JOSE" (MARIA removed)

4. **Build Name Code:**
   - R (first of RODRIGUEZ)
   - O (first vowel in RODRIGUEZ after R)
   - M (first of MARTINEZ)
   - J (first of JOSE)
   - Result: `ROMJ`

5. **Check Prohibited:** "ROMJ" → not in list

6. **Add Birth Date:** `ROMJ950315`

7. **Calculate Homoclave:**
   - Full Name: "RODRIGUEZ MARTINEZ MARIA JOSE" (keep full name!)
   - Calculate → example: `3Y`

8. **Add Verification:** Calculate → example: `7`

9. **Final RFC:** `ROMJ9503153Y7`

---

### Example 4: Missing Maternal Surname

**Input:**
- Full Name: "CARLOS GOMEZ"
- CURP: `GOXC880420HDFXMR04`

**Step-by-Step:**

1. **Extract from CURP:**
   - Birth Date: `880420`
   - Sex: `H`
   - State: `DF`

2. **Parse Name:**
   - First: "CARLOS"
   - Paternal: "GOMEZ"
   - Maternal: "" (missing)

3. **Normalize:**
   - Paternal: "GOMEZ"
   - Maternal: → Use "X" for missing
   - First: "CARLOS"

4. **Build Name Code (Special - One Surname Form):**
   - GO (first 2 of GOMEZ)
   - CA (first 2 of CARLOS)
   - Result: `GOCA`

5. **Check Prohibited:** "GOCA" → not in list

6. **Add Birth Date:** `GOCA880420`

7. **Calculate Homoclave:**
   - Full Name: "GOMEZ  CARLOS" (space for missing maternal)
   - Calculate → example: `1P`

8. **Add Verification:** Calculate → example: `9`

9. **Final RFC:** `GOCA8804201P9`

---

## Implementation Functions

### Main Conversion Function

```typescript
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
```

### Character Mapping Tables

#### For Homoclave Calculation
```typescript
const HOMOCLAVE_CHAR_MAP = {
  ' ': '00', '0': '00', '1': '01', '2': '02', '3': '03', '4': '04', 
  '5': '05', '6': '06', '7': '07', '8': '08', '9': '09', '&': '10',
  'A': '11', 'B': '12', 'C': '13', 'D': '14', 'E': '15', 'F': '16',
  'G': '17', 'H': '18', 'I': '19', 'J': '21', 'K': '22', 'L': '23',
  'M': '24', 'N': '25', 'O': '26', 'P': '27', 'Q': '28', 'R': '29',
  'S': '32', 'T': '33', 'U': '34', 'V': '35', 'W': '36', 'X': '37',
  'Y': '38', 'Z': '39', 'Ñ': '40'
};
```

#### For Verification Digit
```typescript
const VERIFICATION_CHAR_VALUES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18,
  'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25, 'P': 26, 'Q': 27,
  'R': 28, 'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33, 'X': 34, 'Y': 35, 'Z': 36,
  ' ': 37, 'Ñ': 38
};
```

#### Homoclave Output Characters
```typescript
const HOMOCLAVE_DIGITS = '123456789ABCDEFGHIJKLMNPQRSTUVWXYZ';
// Note: 'O' is intentionally omitted (34 characters total)
```

---

## Key Differences: CURP vs RFC

| Feature | CURP | RFC |
|---------|------|-----|
| **Length** | 18 characters | 13 characters |
| **Name Code Position 2** | First internal vowel | First internal vowel (same) |
| **Name Filtering** | Uses filtered name | Uses filtered for code, original for homoclave |
| **Includes State** | Yes (positions 12-13) | No |
| **Includes Sex** | Yes (position 11) | No |
| **Homoclave** | No | Yes (positions 11-12) |
| **Internal Consonants** | Yes (positions 14-16) | No |
| **Century Indicator** | Yes (position 17) | No |
| **Primary Use** | Population registry | Tax registry |

---

## Summary

The CURP to RFC conversion process involves:

1. **Extraction**: Get birth date, sex, and state from CURP
2. **Parsing**: Separate full name into components
3. **Normalization**: Remove accents and particles
4. **Name Code**: Build 4-character code with special rules
5. **Birth Date**: Use 6-character date from CURP
6. **Homoclave**: Complex 2-character calculation
7. **Verification**: Calculate checksum digit

The key insight is that **CURP contains all necessary data for RFC generation**, but RFC requires the full name to calculate the homoclave properly.

---

## Additional Resources

- Mexican SAT (Tax Authority) official RFC rules
- Mexican RENAPO official CURP rules
- Java `rfcfacil` library (reference implementation)
- Official JavaScript CURP generator

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Author:** CURP Converter Project

