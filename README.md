# CURP & RFC Generator + Timestamp Converter

A modern web application with two main tools:
1. **CURP & RFC Generator**: Generate Mexican CURP and RFC codes from personal information
2. **Timestamp Converter**: Convert human-readable timestamps to ISO 8601 format

## Features

### CURP & RFC Generator
- **Bulk CSV Processing**: Upload CSV files with personal data and generate CURP/RFC
- **Local Generation**: All processing is done locally using official algorithms
- **Intelligent Name Parsing**: Uses CURP structure to validate and improve name parsing accuracy
- **Multiple Parsing Strategies**: Tries 5 different strategies and validates each against CURP
- **CURP-Based RFC Generation**: Optimized RFC generation that extracts data directly from CURP
- **Name Validation**: Automatically validates parsed names against CURP structure
- **Multiple Data Sources**: Extracts birth date, sex, and state from NSS or CURP
- **Complete Results**: Download CSV with all original columns plus generated CURP and RFC
- **Quality Assurance**: Includes validation status for each processed name

### Timestamp Converter
- **Multiple Format Support**: Accepts various human-readable date/time formats
- **ISO 8601 Output**: Converts to standard format with nanosecond precision
- **Bulk Processing**: Process entire CSV files at once
- **Error Tracking**: Clear error messages for failed conversions

### General
- **Modern UI**: Beautiful, responsive design with gradient backgrounds
- **Error Handling**: Comprehensive error handling and user feedback
- **Easy Navigation**: Switch between tools with simple navigation

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: CSS Modules
- **CSV Parsing**: PapaParse
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd curp_convertor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### CURP & RFC Generator

1. Navigate to the main page (default)
2. Prepare a CSV file with the required columns (see format below)
3. Click "Choose CSV file" and select your file
4. Click "Upload & Generate"
5. The results will be automatically downloaded as a CSV file with:
   - All original columns preserved
   - `generated_curp`: Newly generated CURP
   - `rfc`: Newly generated RFC
   - `error`: Any error message (if generation failed)

### Timestamp Converter

1. Click "Timestamp Converter →" link in the navigation
2. Prepare a CSV file with the required columns (see format below)
3. Click "Choose CSV file" and select your file
4. Click "Upload & Convert"
5. The results will be automatically downloaded with:
   - All original columns preserved
   - `timestamp`: Converted to ISO 8601 format
   - `conversion_error`: Any error message (if conversion failed)

### Required CSV Format

#### CURP & RFC Generator

Your CSV file must include these columns (column names are case-insensitive):

- **full_name**: Full name in Spanish format (e.g., "Miguel Arroyo De La Cruz")
- **curp**: Valid CURP (18 characters)

**Additional Columns**: Any extra columns in your CSV (employee_id, department, email, salary, etc.) will be automatically preserved and included in the output file.

**That's it!** The system automatically extracts:
- ✅ Birth date from CURP (positions 4-9)
- ✅ Sex from CURP (position 10: H/M)
- ✅ State code from CURP (positions 11-12)

The CURP also validates that your name parsing is correct using intelligent pattern matching!

#### Timestamp Converter

Your CSV file must include these columns:

- **identifier**: Unique identifier for the record
- **ip_address**: IP address
- **privacy_notice_url**: URL to privacy notice
- **timestamp**: Human-readable timestamp

**Supported timestamp formats:**
- "August 20, 2025, 10:52 AM"
- "Aug 20, 2025 10:52 AM"
- "2025-08-20 10:52:30"
- "2025/08/20 10:52"
- "08/20/2025 10:52 AM"
- "2025-08-20T10:52:00"
- "20 August 2025 10:52"

**Output format:** `YYYY-MM-DDTHH:mm:ss.nnnnnnnnnZ` (ISO 8601 with nanosecond precision)

### CSV Format Examples

#### CURP & RFC Generator Input

**Basic Format (minimum required):**
```csv
full_name,curp
MIGUEL ARROYO DE LA CRUZ,AACM910503HVZRRG09
MARIA JOSE GARCIA LOPEZ,GALM850615MDFRRR08
```

**With Additional Columns (all preserved in output):**
```csv
full_name,curp,employee_id,department,salary,hire_date,email,phone
MIGUEL ARROYO DE LA CRUZ,AACM910503HVZRRG09,EMP001,IT,75000,2020-01-15,miguel.arroyo@company.com,555-0101
MARIA JOSE GARCIA LOPEZ,GALM850615MDFRRR08,EMP002,HR,65000,2019-03-10,maria.garcia@company.com,555-0102
```

**Note:** Only `full_name` and `curp` columns are required! All additional columns are preserved in the output, and birth date, sex, and state are extracted from the CURP automatically.

#### CURP & RFC Generator Output

**Basic Output:**
```csv
full_name,curp,generated_curp,rfc,name_validation,error
MIGUEL ARROYO DE LA CRUZ,AACM910503HVZRRG09,AACM910503HVZRRG09,AACM9105039,VALIDATED,
MARIA JOSE GARCIA LOPEZ,GALM850615MDFRRR08,GALM850615MDFRRR08,GALM850615AB3,VALIDATED,
```

**With Additional Columns (all preserved):**
```csv
full_name,curp,employee_id,department,salary,hire_date,email,phone,generated_curp,rfc,name_validation,error
MIGUEL ARROYO DE LA CRUZ,AACM910503HVZRRG09,EMP001,IT,75000,2020-01-15,miguel.arroyo@company.com,555-0101,AACM910503HVZRRG09,AACM9105039,VALIDATED,
MARIA JOSE GARCIA LOPEZ,GALM850615MDFRRR08,EMP002,HR,65000,2019-03-10,maria.garcia@company.com,555-0102,GALM850615MDFRRR08,GALM850615AB3,VALIDATED,
```

**New Columns:**
- `generated_curp`: Newly generated CURP based on name parsing
- `rfc`: Generated RFC
- `name_validation`: "VALIDATED" if name parsing matches CURP structure, "WARNING" otherwise
- `error`: Any error messages

#### Timestamp Converter Input

```csv
identifier,ip_address,privacy_notice_url,timestamp
USER001,192.168.1.100,https://example.com/privacy,"August 20, 2025, 10:52 AM"
USER002,192.168.1.101,https://example.com/privacy,"September 10, 2025, 9:40 PM"
USER003,10.0.0.50,https://example.com/privacy,"Dec 25, 2024 3:15 PM"
USER004,172.16.0.1,https://example.com/privacy,2025-01-15 08:30:00
```

#### Timestamp Converter Output

```csv
identifier,ip_address,privacy_notice_url,timestamp,conversion_error
USER001,192.168.1.100,https://example.com/privacy,2025-08-20T10:52:00.000000000Z,
USER002,192.168.1.101,https://example.com/privacy,2025-09-10T21:40:00.000000000Z,
USER003,10.0.0.50,https://example.com/privacy,2024-12-25T15:15:00.000000000Z,
USER004,172.16.0.1,https://example.com/privacy,2025-01-15T08:30:00.000000000Z,
```

## Mexican State Codes

The following two-letter state codes are supported:

- **AS**: Aguascalientes
- **BC**: Baja California
- **BS**: Baja California Sur
- **CC**: Campeche
- **CL**: Coahuila
- **CM**: Colima
- **CS**: Chiapas
- **CH**: Chihuahua
- **DF**: Ciudad de México
- **DG**: Durango
- **GT**: Guanajuato
- **GR**: Guerrero
- **HG**: Hidalgo
- **JC**: Jalisco
- **MC**: México
- **MN**: Michoacán
- **MS**: Morelos
- **NT**: Nayarit
- **NL**: Nuevo León
- **OC**: Oaxaca
- **PL**: Puebla
- **QT**: Querétaro
- **QR**: Quintana Roo
- **SP**: San Luis Potosí
- **SL**: Sinaloa
- **SR**: Sonora
- **TC**: Tabasco
- **TS**: Tamaulipas
- **TL**: Tlaxcala
- **VZ**: Veracruz
- **YN**: Yucatán
- **ZS**: Zacatecas
- **NE**: Nacido en el Extranjero

## Deployment to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to complete deployment

### Option 2: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

### Option 3: Deploy Button

Click the button below to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

## Project Structure

```
curp_convertor/
├── pages/
│   ├── api/
│   │   └── convert.ts              # API route for CURP/RFC generation
│   ├── _app.tsx                    # App wrapper
│   ├── index.tsx                   # CURP & RFC Generator page
│   └── timestamp.tsx               # Timestamp Converter page
├── styles/
│   ├── globals.css                 # Global styles
│   └── Home.module.css             # Page-specific styles
├── utils/
│   ├── csvUtils.ts                 # CSV parsing and generation utilities
│   ├── rfcCurpGenerator.ts         # RFC and CURP generation algorithms
│   ├── nameParser.ts               # Mexican name parsing logic
│   ├── dataExtractor.ts            # NSS/CURP data extraction utilities
│   ├── timestampUtils.ts           # Timestamp conversion utilities
│   └── timestampCsvUtils.ts        # Timestamp CSV processing
├── example.csv                     # Example CSV for CURP/RFC
├── timestamp_example.csv           # Example CSV for timestamps
├── test_curp_intelligence.csv      # Test cases for CURP intelligence features
├── CURP_INTELLIGENCE.md            # Detailed documentation on CURP intelligence
├── TIMESTAMP_CONVERTER_GUIDE.md    # Timestamp converter documentation
├── package.json
├── tsconfig.json
├── next.config.js
└── vercel.json
```

## API Routes

### POST /api/convert

Generates CURP and RFC codes from personal information.

**Request Body:**
```json
{
  "rows": [
    {
      "full_name": "MIGUEL ARROYO DE LA CRUZ",
      "nss": "12345678901",
      "state": "VZ",
      "curp": "AACM910503HVZRRG09"
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "full_name": "MIGUEL ARROYO DE LA CRUZ",
      "nss": "12345678901",
      "state": "VZ",
      "curp": "AACM910503HVZRRG09",
      "generated_curp": "AACM910503HVZRRG09",
      "rfc": "AACM9105039",
      "error": ""
    }
  ]
}
```

## Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Error Handling

The application handles various error scenarios:

- Invalid or missing full name
- Unable to parse Mexican names
- Invalid NSS format
- Invalid state codes
- Missing birth date information
- CSV parsing errors
- Missing or invalid columns in CSV

All errors are displayed to the user with clear messages and included in the error column of the output CSV.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## CURP Intelligence

The system includes sophisticated algorithms that use CURP structure to improve accuracy:

### Intelligent Name Parsing

The system tries **5 different parsing strategies** and validates each against the CURP structure:

1. **Standard Parsing**: First word = first name, second = paternal, third = maternal
2. **Last Two Words as Surnames**: Everything before last 2 words = first name
3. **First Word as First Name**: Remaining words split between surnames
4. **Compound First Name**: First 2 words = first name
5. **Smart Split**: Intelligent distribution for 5+ words

**Example:**
```
Name: "MARIA DEL CARMEN GARCIA LOPEZ"
CURP: "GALM850615MDFRRR08"

CURP Hints:
- Position 0 (G) = Paternal surname starts with G
- Position 1 (A) = First internal vowel in paternal is A
- Position 2 (L) = Maternal surname starts with L
- Position 3 (M) = First name starts with M

Validation:
✓ firstName: "MARIA DEL CARMEN" (starts with M)
✓ paternalSurname: "GARCIA" (starts with G, first vowel A)
✓ maternalSurname: "LOPEZ" (starts with L)
```

### CURP Structure

```
CURP: A A C M 9 1 0 5 0 3 H V Z R R G 0 9
      │ │ │ │ └─┬──┘└─┬─┘ │ │ │
      │ │ │ │   │     │   │ │ └─ State code
      │ │ │ │   │     │   │ └─── Sex (H/M)
      │ │ │ │   │     └───────── Birth day
      │ │ │ │   └───────────────── Birth month
      │ │ │ └───────────────────── First name initial
      │ │ └─────────────────────── Maternal surname initial
      │ └───────────────────────── Paternal first vowel
      └─────────────────────────── Paternal surname initial
```

### Optimized RFC Generation

When CURP is available, the system can generate RFC more efficiently:

```typescript
// Traditional method (requires all data)
generateRFC(firstName, paternalSurname, maternalSurname, birthDate, sex, state)

// CURP-based method (extracts data automatically)
generateRFCFromCURP(firstName, paternalSurname, maternalSurname, curp)
```

**Benefits:**
- ✅ Less data required
- ✅ Guaranteed consistency
- ✅ Faster processing
- ✅ Automatic data extraction

For more details, see [CURP_INTELLIGENCE.md](./CURP_INTELLIGENCE.md)

---

## How It Works

### RFC Generation Algorithm

The RFC (Registro Federal de Contribuyentes) is generated using the official Mexican algorithm:

1. Extract first letter and first internal vowel from paternal surname
2. Extract first letter from maternal surname
3. Extract first letter from first name
4. Add birth date (YYMMDD)
5. Calculate homoclave (homonym code) using full name
6. Calculate verification digit

### CURP Generation Algorithm

The CURP (Clave Única de Registro de Población) is generated using the official Mexican algorithm:

1. Extract first letter and first internal vowel from paternal surname
2. Extract first letter from maternal surname
3. Extract first letter from first name
4. Add birth date (YYMMDD)
5. Add sex (H/M)
6. Add state code (2 letters)
7. Extract first internal consonants from surnames and name
8. Calculate verification digit based on birth year

### Name Parsing

The system intelligently parses Mexican names using these rules:

**By word count:**
- **1 word**: First name only
- **2 words**: First name + Paternal surname
- **3 words**: First name + Paternal surname + Maternal surname
- **4 words**: First two words are first name (compound), 3rd is paternal, 4th is maternal
  - Example: "JOSE LUIS FERNANDEZ TORRES" → First: "JOSE LUIS", Paternal: "FERNANDEZ", Maternal: "TORRES"
- **5+ words**: Detects known compound names or uses particle detection

**Additional features:**
- Recognizes compound first names (e.g., "José María", "Juan Carlos", "María Guadalupe")
- Handles surname particles (de, del, de la, los, las, etc.)
- Filters common prefixes from first names (Jose, Maria, Ma, Ma.) for RFC calculation
- Supports names with missing maternal surnames

### State Name Conversion

The system automatically converts full state names to their official two-letter codes:

- **Case-insensitive**: "veracruz", "Veracruz", "VERACRUZ" all work
- **Accent-insensitive**: "Mexico" and "México" both convert correctly
- **Flexible matching**: Partial matches like "Baja California" work
- **Multiple formats**: Accepts "Ciudad de México", "CDMX", "DF" for Mexico City
- **Already a code?**: If you provide "VZ" or "DF", it's recognized immediately

Supported variations include:
- "Ciudad de México", "Ciudad de Mexico", "CDMX", "DF" → DF
- "Estado de México", "Mexico", "México" → MC
- "Nuevo León", "Nuevo Leon" → NL
- And all 33 Mexican states plus "Extranjero" for foreign-born

## License

MIT

## Support

For issues or questions, please contact the development team.

