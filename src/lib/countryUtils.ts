/**
 * Country Utilities
 * Handles country flags, names, and formatting
 */

// ISO 3166-1 alpha-2 country codes to flag emojis
export const countryToFlag = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

// Country code to full name mapping
export const countryNames: Record<string, string> = {
  // Southeast Asia
  TH: "Thailand",
  VN: "Vietnam",
  SG: "Singapore",
  MY: "Malaysia",
  ID: "Indonesia",
  PH: "Philippines",
  MM: "Myanmar",
  KH: "Cambodia",
  LA: "Laos",
  BN: "Brunei",
  TL: "Timor-Leste",
  
  // East Asia
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  TW: "Taiwan",
  HK: "Hong Kong",
  MO: "Macau",
  MN: "Mongolia",
  
  // South Asia
  IN: "India",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  NP: "Nepal",
  BT: "Bhutan",
  MV: "Maldives",
  AF: "Afghanistan",
  
  // Middle East
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  IL: "Israel",
  TR: "Turkey",
  IR: "Iran",
  IQ: "Iraq",
  JO: "Jordan",
  LB: "Lebanon",
  SY: "Syria",
  YE: "Yemen",
  OM: "Oman",
  KW: "Kuwait",
  BH: "Bahrain",
  QA: "Qatar",
  
  // Europe
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  CH: "Switzerland",
  AT: "Austria",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  RO: "Romania",
  GR: "Greece",
  PT: "Portugal",
  IE: "Ireland",
  
  // Americas
  US: "United States",
  CA: "Canada",
  MX: "Mexico",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  VE: "Venezuela",
  EC: "Ecuador",
  BO: "Bolivia",
  PY: "Paraguay",
  UY: "Uruguay",
  
  // Oceania
  AU: "Australia",
  NZ: "New Zealand",
  FJ: "Fiji",
  PG: "Papua New Guinea",
  
  // Africa
  ZA: "South Africa",
  EG: "Egypt",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  MA: "Morocco",
  TN: "Tunisia",
  DZ: "Algeria",
  ET: "Ethiopia",
  UG: "Uganda",
};

// Get country name from code
export const getCountryName = (countryCode: string | null | undefined): string => {
  if (!countryCode) return "Unknown";
  return countryNames[countryCode.toUpperCase()] || countryCode;
};

// Get country display (flag + name)
export const getCountryDisplay = (countryCode: string | null | undefined): string => {
  if (!countryCode) return "🌍 Unknown";
  const flag = countryToFlag(countryCode);
  const name = getCountryName(countryCode);
  return `${flag} ${name}`;
};

// Get just the flag
export const getCountryFlag = (countryCode: string | null | undefined): string => {
  if (!countryCode) return "🌍";
  return countryToFlag(countryCode);
};

// Format full name from first and last name
export const formatFullName = (
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string => {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";
  
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "No name";
};

// Get user display name with fallback
export const getUserDisplayName = (
  fullName: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined
): string => {
  if (fullName?.trim()) return fullName;
  
  const formattedName = formatFullName(firstName, lastName);
  if (formattedName !== "No name") return formattedName;
  
  if (email) return email.split("@")[0];
  
  return "Anonymous User";
};