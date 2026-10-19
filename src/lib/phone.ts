// Phone numbers are stored in E.164 (e.g. +2348012345678). Nigeria is the
// default market; the country list covers Africa so we can expand without a
// code change. Each account holds at most two numbers: one on the creator
// profile, one on the brand profile.

export type Country = { code: string; name: string; dial: string; flag: string };

// Nigeria first (default market), then the rest of Africa alphabetically.
export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", dial: "234", flag: "🇳🇬" },
  { code: "DZ", name: "Algeria", dial: "213", flag: "🇩🇿" },
  { code: "AO", name: "Angola", dial: "244", flag: "🇦🇴" },
  { code: "BJ", name: "Benin", dial: "229", flag: "🇧🇯" },
  { code: "BW", name: "Botswana", dial: "267", flag: "🇧🇼" },
  { code: "BF", name: "Burkina Faso", dial: "226", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", dial: "257", flag: "🇧🇮" },
  { code: "CM", name: "Cameroon", dial: "237", flag: "🇨🇲" },
  { code: "CV", name: "Cape Verde", dial: "238", flag: "🇨🇻" },
  { code: "CF", name: "Central African Rep.", dial: "236", flag: "🇨🇫" },
  { code: "TD", name: "Chad", dial: "235", flag: "🇹🇩" },
  { code: "KM", name: "Comoros", dial: "269", flag: "🇰🇲" },
  { code: "CG", name: "Congo", dial: "242", flag: "🇨🇬" },
  { code: "CD", name: "DR Congo", dial: "243", flag: "🇨🇩" },
  { code: "CI", name: "Côte d'Ivoire", dial: "225", flag: "🇨🇮" },
  { code: "DJ", name: "Djibouti", dial: "253", flag: "🇩🇯" },
  { code: "EG", name: "Egypt", dial: "20", flag: "🇪🇬" },
  { code: "GQ", name: "Equatorial Guinea", dial: "240", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", dial: "291", flag: "🇪🇷" },
  { code: "SZ", name: "Eswatini", dial: "268", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", dial: "251", flag: "🇪🇹" },
  { code: "GA", name: "Gabon", dial: "241", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", dial: "220", flag: "🇬🇲" },
  { code: "GH", name: "Ghana", dial: "233", flag: "🇬🇭" },
  { code: "GN", name: "Guinea", dial: "224", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", dial: "245", flag: "🇬🇼" },
  { code: "KE", name: "Kenya", dial: "254", flag: "🇰🇪" },
  { code: "LS", name: "Lesotho", dial: "266", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", dial: "231", flag: "🇱🇷" },
  { code: "LY", name: "Libya", dial: "218", flag: "🇱🇾" },
  { code: "MG", name: "Madagascar", dial: "261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", dial: "265", flag: "🇲🇼" },
  { code: "ML", name: "Mali", dial: "223", flag: "🇲🇱" },
  { code: "MR", name: "Mauritania", dial: "222", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", dial: "230", flag: "🇲🇺" },
  { code: "MA", name: "Morocco", dial: "212", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", dial: "258", flag: "🇲🇿" },
  { code: "NA", name: "Namibia", dial: "264", flag: "🇳🇦" },
  { code: "NE", name: "Niger", dial: "227", flag: "🇳🇪" },
  { code: "RW", name: "Rwanda", dial: "250", flag: "🇷🇼" },
  { code: "ST", name: "São Tomé & Príncipe", dial: "239", flag: "🇸🇹" },
  { code: "SN", name: "Senegal", dial: "221", flag: "🇸🇳" },
  { code: "SC", name: "Seychelles", dial: "248", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", dial: "232", flag: "🇸🇱" },
  { code: "SO", name: "Somalia", dial: "252", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦" },
  { code: "SS", name: "South Sudan", dial: "211", flag: "🇸🇸" },
  { code: "SD", name: "Sudan", dial: "249", flag: "🇸🇩" },
  { code: "TZ", name: "Tanzania", dial: "255", flag: "🇹🇿" },
  { code: "TG", name: "Togo", dial: "228", flag: "🇹🇬" },
  { code: "TN", name: "Tunisia", dial: "216", flag: "🇹🇳" },
  { code: "UG", name: "Uganda", dial: "256", flag: "🇺🇬" },
  { code: "ZM", name: "Zambia", dial: "260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial: "263", flag: "🇿🇼" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Nigeria

const byDialDesc = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

/** Split a stored E.164 number back into {country, national} for editing. */
export function parsePhone(e164?: string | null): { code: string; national: string } {
  const raw = (e164 ?? "").replace(/[^\d+]/g, "");
  if (raw.startsWith("+")) {
    const digits = raw.slice(1);
    const match = byDialDesc.find((c) => digits.startsWith(c.dial));
    if (match) return { code: match.code, national: digits.slice(match.dial.length) };
  }
  return { code: DEFAULT_COUNTRY.code, national: raw.replace(/\D/g, "") };
}

/** Build an E.164 string from a country code + the national part the user typed. */
export function toE164(countryCode: string, national: string): string | null {
  const c = COUNTRIES.find((x) => x.code === countryCode) ?? DEFAULT_COUNTRY;
  // Strip spaces, dashes and a leading trunk 0 (common in NG: 0803… -> 803…).
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length < 6 || digits.length > 14) return null;
  return `+${c.dial}${digits}`;
}

/** A readable form for display, e.g. "+234 803 123 4567" (loose grouping). */
export function formatPhone(e164?: string | null): string {
  if (!e164) return "";
  const { code, national } = parsePhone(e164);
  const c = COUNTRIES.find((x) => x.code === code) ?? DEFAULT_COUNTRY;
  const grouped = national.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  return `+${c.dial} ${grouped}`;
}
