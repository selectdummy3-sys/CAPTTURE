import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CountryOption {
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
}

export const COUNTRIES: CountryOption[] = [
  { name: "South Africa", code: "ZA", currency: "ZAR", currencySymbol: "R" },
  { name: "United Kingdom", code: "GB", currency: "GBP", currencySymbol: "\u00a3" },
  { name: "United States", code: "US", currency: "USD", currencySymbol: "$" },
  { name: "Germany", code: "DE", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Netherlands", code: "NL", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Canada", code: "CA", currency: "CAD", currencySymbol: "C$" },
  { name: "Australia", code: "AU", currency: "AUD", currencySymbol: "A$" },
  { name: "New Zealand", code: "NZ", currency: "NZD", currencySymbol: "NZ$" },
  { name: "France", code: "FR", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Italy", code: "IT", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Spain", code: "ES", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Ireland", code: "IE", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Czechia", code: "CZ", currency: "CZK", currencySymbol: "K\u010d" },
  { name: "Albania", code: "AL", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Algeria", code: "DZ", currency: "USD", currencySymbol: "$" },
  { name: "Andorra", code: "AD", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Angola", code: "AO", currency: "USD", currencySymbol: "$" },
  { name: "Argentina", code: "AR", currency: "USD", currencySymbol: "$" },
  { name: "Armenia", code: "AM", currency: "USD", currencySymbol: "$" },
  { name: "Aruba", code: "AW", currency: "USD", currencySymbol: "$" },
  { name: "Austria", code: "AT", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Azerbaijan", code: "AZ", currency: "USD", currencySymbol: "$" },
  { name: "Bahamas", code: "BS", currency: "USD", currencySymbol: "$" },
  { name: "Bahrain", code: "BH", currency: "USD", currencySymbol: "$" },
  { name: "Bangladesh", code: "BD", currency: "USD", currencySymbol: "$" },
  { name: "Barbados", code: "BB", currency: "USD", currencySymbol: "$" },
  { name: "Belgium", code: "BE", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Belize", code: "BZ", currency: "USD", currencySymbol: "$" },
  { name: "Benin", code: "BJ", currency: "USD", currencySymbol: "$" },
  { name: "Bolivia", code: "BO", currency: "USD", currencySymbol: "$" },
  { name: "Bosnia & Herzegovina", code: "BA", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Botswana", code: "BW", currency: "USD", currencySymbol: "$" },
  { name: "Brazil", code: "BR", currency: "USD", currencySymbol: "$" },
  { name: "British Virgin Islands", code: "VG", currency: "USD", currencySymbol: "$" },
  { name: "Brunei", code: "BN", currency: "USD", currencySymbol: "$" },
  { name: "Bulgaria", code: "BG", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Burkina Faso", code: "BF", currency: "USD", currencySymbol: "$" },
  { name: "Burundi", code: "BI", currency: "USD", currencySymbol: "$" },
  { name: "Cambodia", code: "KH", currency: "USD", currencySymbol: "$" },
  { name: "Cameroon", code: "CM", currency: "USD", currencySymbol: "$" },
  { name: "Cape Verde", code: "CV", currency: "USD", currencySymbol: "$" },
  { name: "Cayman Islands", code: "KY", currency: "USD", currencySymbol: "$" },
  { name: "Chad", code: "TD", currency: "USD", currencySymbol: "$" },
  { name: "Chile", code: "CL", currency: "USD", currencySymbol: "$" },
  { name: "China", code: "CN", currency: "USD", currencySymbol: "$" },
  { name: "Colombia", code: "CO", currency: "USD", currencySymbol: "$" },
  { name: "Comoros", code: "KM", currency: "USD", currencySymbol: "$" },
  { name: "Congo - Brazzaville", code: "CG", currency: "USD", currencySymbol: "$" },
  { name: "Cook Islands", code: "CK", currency: "USD", currencySymbol: "$" },
  { name: "Costa Rica", code: "CR", currency: "USD", currencySymbol: "$" },
  { name: "C\u00f4te d\u2019Ivoire", code: "CI", currency: "USD", currencySymbol: "$" },
  { name: "Croatia", code: "HR", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Cura\u00e7ao", code: "CW", currency: "USD", currencySymbol: "$" },
  { name: "Cyprus", code: "CY", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Denmark", code: "DK", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Djibouti", code: "DJ", currency: "USD", currencySymbol: "$" },
  { name: "Dominica", code: "DM", currency: "USD", currencySymbol: "$" },
  { name: "Dominican Republic", code: "DO", currency: "USD", currencySymbol: "$" },
  { name: "Ecuador", code: "EC", currency: "USD", currencySymbol: "$" },
  { name: "Egypt", code: "EG", currency: "USD", currencySymbol: "$" },
  { name: "El Salvador", code: "SV", currency: "USD", currencySymbol: "$" },
  { name: "Equatorial Guinea", code: "GQ", currency: "USD", currencySymbol: "$" },
  { name: "Estonia", code: "EE", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Eswatini", code: "SZ", currency: "USD", currencySymbol: "$" },
  { name: "Ethiopia", code: "ET", currency: "USD", currencySymbol: "$" },
  { name: "Falkland Islands", code: "FK", currency: "USD", currencySymbol: "$" },
  { name: "Faroe Islands", code: "FO", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Fiji", code: "FJ", currency: "USD", currencySymbol: "$" },
  { name: "Finland", code: "FI", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "French Guiana", code: "GF", currency: "USD", currencySymbol: "$" },
  { name: "French Polynesia", code: "PF", currency: "USD", currencySymbol: "$" },
  { name: "Gabon", code: "GA", currency: "USD", currencySymbol: "$" },
  { name: "Gambia", code: "GM", currency: "USD", currencySymbol: "$" },
  { name: "Georgia", code: "GE", currency: "USD", currencySymbol: "$" },
  { name: "Ghana", code: "GH", currency: "USD", currencySymbol: "$" },
  { name: "Gibraltar", code: "GI", currency: "USD", currencySymbol: "$" },
  { name: "Greece", code: "GR", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Greenland", code: "GL", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Grenada", code: "GD", currency: "USD", currencySymbol: "$" },
  { name: "Guadeloupe", code: "GP", currency: "USD", currencySymbol: "$" },
  { name: "Guatemala", code: "GT", currency: "USD", currencySymbol: "$" },
  { name: "Guernsey", code: "GG", currency: "GBP", currencySymbol: "\u00a3" },
  { name: "Guinea", code: "GN", currency: "USD", currencySymbol: "$" },
  { name: "Guinea-Bissau", code: "GW", currency: "USD", currencySymbol: "$" },
  { name: "Guyana", code: "GY", currency: "USD", currencySymbol: "$" },
  { name: "Haiti", code: "HT", currency: "USD", currencySymbol: "$" },
  { name: "Honduras", code: "HN", currency: "USD", currencySymbol: "$" },
  { name: "Hong Kong", code: "HK", currency: "USD", currencySymbol: "$" },
  { name: "Hungary", code: "HU", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Iceland", code: "IS", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "India", code: "IN", currency: "USD", currencySymbol: "$" },
  { name: "Indonesia", code: "ID", currency: "USD", currencySymbol: "$" },
  { name: "Isle of Man", code: "IM", currency: "GBP", currencySymbol: "\u00a3" },
  { name: "Israel", code: "IL", currency: "ILS", currencySymbol: "\u20aa" },
  { name: "Jamaica", code: "JM", currency: "USD", currencySymbol: "$" },
  { name: "Japan", code: "JP", currency: "USD", currencySymbol: "$" },
  { name: "Jersey", code: "JE", currency: "GBP", currencySymbol: "\u00a3" },
  { name: "Jordan", code: "JO", currency: "USD", currencySymbol: "$" },
  { name: "Kenya", code: "KE", currency: "USD", currencySymbol: "$" },
  { name: "Kuwait", code: "KW", currency: "USD", currencySymbol: "$" },
  { name: "Kyrgyzstan", code: "KG", currency: "USD", currencySymbol: "$" },
  { name: "Laos", code: "LA", currency: "USD", currencySymbol: "$" },
  { name: "Latvia", code: "LV", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Lebanon", code: "LB", currency: "USD", currencySymbol: "$" },
  { name: "Lesotho", code: "LS", currency: "USD", currencySymbol: "$" },
  { name: "Liberia", code: "LR", currency: "USD", currencySymbol: "$" },
  { name: "Liechtenstein", code: "LI", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Lithuania", code: "LT", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Luxembourg", code: "LU", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Macao", code: "MO", currency: "USD", currencySymbol: "$" },
  { name: "Malawi", code: "MW", currency: "USD", currencySymbol: "$" },
  { name: "Malaysia", code: "MY", currency: "USD", currencySymbol: "$" },
  { name: "Maldives", code: "MV", currency: "USD", currencySymbol: "$" },
  { name: "Malta", code: "MT", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Martinique", code: "MQ", currency: "USD", currencySymbol: "$" },
  { name: "Mauritius", code: "MU", currency: "USD", currencySymbol: "$" },
  { name: "Mayotte", code: "YT", currency: "USD", currencySymbol: "$" },
  { name: "Mexico", code: "MX", currency: "MXN", currencySymbol: "$" },
  { name: "Moldova", code: "MD", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Monaco", code: "MC", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Mongolia", code: "MN", currency: "USD", currencySymbol: "$" },
  { name: "Montenegro", code: "ME", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Montserrat", code: "MS", currency: "USD", currencySymbol: "$" },
  { name: "Morocco", code: "MA", currency: "USD", currencySymbol: "$" },
  { name: "Mozambique", code: "MZ", currency: "USD", currencySymbol: "$" },
  { name: "Namibia", code: "NA", currency: "USD", currencySymbol: "$" },
  { name: "Nauru", code: "NR", currency: "USD", currencySymbol: "$" },
  { name: "Nepal", code: "NP", currency: "USD", currencySymbol: "$" },
  { name: "New Caledonia", code: "NC", currency: "USD", currencySymbol: "$" },
  { name: "Nicaragua", code: "NI", currency: "USD", currencySymbol: "$" },
  { name: "Nigeria", code: "NG", currency: "USD", currencySymbol: "$" },
  { name: "Niue", code: "NU", currency: "USD", currencySymbol: "$" },
  { name: "North Macedonia", code: "MK", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Norway", code: "NO", currency: "NOK", currencySymbol: "kr" },
  { name: "Oman", code: "OM", currency: "USD", currencySymbol: "$" },
  { name: "Pakistan", code: "PK", currency: "USD", currencySymbol: "$" },
  { name: "Panama", code: "PA", currency: "USD", currencySymbol: "$" },
  { name: "Papua New Guinea", code: "PG", currency: "USD", currencySymbol: "$" },
  { name: "Paraguay", code: "PY", currency: "USD", currencySymbol: "$" },
  { name: "Peru", code: "PE", currency: "USD", currencySymbol: "$" },
  { name: "Philippines", code: "PH", currency: "USD", currencySymbol: "$" },
  { name: "Poland", code: "PL", currency: "PLN", currencySymbol: "z\u0142" },
  { name: "Portugal", code: "PT", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Qatar", code: "QA", currency: "QAR", currencySymbol: "\u0631.\u0642" },
  { name: "R\u00e9union", code: "RE", currency: "USD", currencySymbol: "$" },
  { name: "Romania", code: "RO", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Rwanda", code: "RW", currency: "USD", currencySymbol: "$" },
  { name: "Samoa", code: "WS", currency: "USD", currencySymbol: "$" },
  { name: "San Marino", code: "SM", currency: "USD", currencySymbol: "$" },
  { name: "S\u00e3o Tom\u00e9 & Pr\u00edncipe", code: "ST", currency: "USD", currencySymbol: "$" },
  { name: "Saudi Arabia", code: "SA", currency: "USD", currencySymbol: "$" },
  { name: "Senegal", code: "SN", currency: "USD", currencySymbol: "$" },
  { name: "Serbia", code: "RS", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Seychelles", code: "SC", currency: "USD", currencySymbol: "$" },
  { name: "Sierra Leone", code: "SL", currency: "USD", currencySymbol: "$" },
  { name: "Singapore", code: "SG", currency: "SGD", currencySymbol: "S$" },
  { name: "Sint Maarten", code: "SX", currency: "USD", currencySymbol: "$" },
  { name: "Slovakia", code: "SK", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Slovenia", code: "SI", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Solomon Islands", code: "SB", currency: "USD", currencySymbol: "$" },
  { name: "South Korea", code: "KR", currency: "USD", currencySymbol: "$" },
  { name: "Sri Lanka", code: "LK", currency: "USD", currencySymbol: "$" },
  { name: "St. Barth\u00e9lemy", code: "BL", currency: "USD", currencySymbol: "$" },
  { name: "St. Helena", code: "SH", currency: "USD", currencySymbol: "$" },
  { name: "St. Kitts & Nevis", code: "KN", currency: "USD", currencySymbol: "$" },
  { name: "St. Lucia", code: "LC", currency: "USD", currencySymbol: "$" },
  { name: "St. Martin", code: "MF", currency: "USD", currencySymbol: "$" },
  { name: "St. Vincent & Grenadines", code: "VC", currency: "USD", currencySymbol: "$" },
  { name: "Sudan", code: "SD", currency: "USD", currencySymbol: "$" },
  { name: "Suriname", code: "SR", currency: "USD", currencySymbol: "$" },
  { name: "Sweden", code: "SE", currency: "SEK", currencySymbol: "kr" },
  { name: "Switzerland", code: "CH", currency: "CHF", currencySymbol: "CHF" },
  { name: "Taiwan", code: "TW", currency: "USD", currencySymbol: "$" },
  { name: "Tanzania", code: "TZ", currency: "USD", currencySymbol: "$" },
  { name: "Thailand", code: "TH", currency: "USD", currencySymbol: "$" },
  { name: "Timor-Leste", code: "TL", currency: "USD", currencySymbol: "$" },
  { name: "Togo", code: "TG", currency: "USD", currencySymbol: "$" },
  { name: "Tonga", code: "TO", currency: "USD", currencySymbol: "$" },
  { name: "Trinidad & Tobago", code: "TT", currency: "USD", currencySymbol: "$" },
  { name: "Tunisia", code: "TN", currency: "USD", currencySymbol: "$" },
  { name: "T\u00fcrkiye", code: "TR", currency: "EUR", currencySymbol: "\u20ac" },
  { name: "Turkmenistan", code: "TM", currency: "USD", currencySymbol: "$" },
  { name: "Turks & Caicos Islands", code: "TC", currency: "USD", currencySymbol: "$" },
  { name: "Tuvalu", code: "TV", currency: "USD", currencySymbol: "$" },
  { name: "Uganda", code: "UG", currency: "USD", currencySymbol: "$" },
  { name: "United Arab Emirates", code: "AE", currency: "AED", currencySymbol: "d.\u0625" },
  { name: "Uruguay", code: "UY", currency: "USD", currencySymbol: "$" },
  { name: "Uzbekistan", code: "UZ", currency: "USD", currencySymbol: "$" },
  { name: "Vanuatu", code: "VU", currency: "USD", currencySymbol: "$" },
  { name: "Vatican City", code: "VA", currency: "USD", currencySymbol: "$" },
  { name: "Venezuela", code: "VE", currency: "USD", currencySymbol: "$" },
  { name: "Vietnam", code: "VN", currency: "USD", currencySymbol: "$" },
  { name: "Wallis & Futuna", code: "WF", currency: "USD", currencySymbol: "$" },
  { name: "Zambia", code: "ZM", currency: "USD", currencySymbol: "$" },
  { name: "Zimbabwe", code: "ZW", currency: "USD", currencySymbol: "$" },
];

export const CURRENCIES: Record<
  string,
  { code: string; symbol: string; locale: string }
> = {
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA" },
  GBP: { code: "GBP", symbol: "\u00a3", locale: "en-GB" },
  USD: { code: "USD", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", symbol: "\u20ac", locale: "de-DE" },
  CAD: { code: "CAD", symbol: "C$", locale: "en-CA" },
  AUD: { code: "AUD", symbol: "A$", locale: "en-AU" },
  NZD: { code: "NZD", symbol: "NZ$", locale: "en-NZ" },
  CZK: { code: "CZK", symbol: "K\u010d", locale: "cs-CZ" },
  ILS: { code: "ILS", symbol: "\u20aa", locale: "he-IL" },
  MXN: { code: "MXN", symbol: "$", locale: "es-MX" },
  NOK: { code: "NOK", symbol: "kr", locale: "nb-NO" },
  PLN: { code: "PLN", symbol: "z\u0142", locale: "pl-PL" },
  QAR: { code: "QAR", symbol: "\u0631.\u0642", locale: "ar-QA" },
  SGD: { code: "SGD", symbol: "S$", locale: "en-SG" },
  SEK: { code: "SEK", symbol: "kr", locale: "sv-SE" },
  CHF: { code: "CHF", symbol: "CHF", locale: "de-CH" },
  AED: { code: "AED", symbol: "d.\u0625", locale: "ar-AE" },
};

/** Approximate exchange rates from ZAR (base). These are display-only approximations
 *  and can be updated or replaced with a live rate API in the future. */
export const EXCHANGE_RATES_FROM_ZAR: Record<string, number> = {
  ZAR: 1,
  GBP: 0.042,
  USD: 0.053,
  EUR: 0.050,
  CAD: 0.074,
  AUD: 0.082,
  NZD: 0.089,
  CZK: 1.26,
  ILS: 0.19,
  MXN: 0.91,
  NOK: 0.58,
  PLN: 0.22,
  QAR: 0.19,
  SGD: 0.072,
  SEK: 0.57,
  CHF: 0.048,
  AED: 0.19,
};

export type LanguageOption = "en";

export const LANGUAGES: { code: LanguageOption; label: string }[] = [
  { code: "en", label: "English" },
];

interface CountryState {
  countryCode: string;
  currency: string;
  language: LanguageOption;
  /** Timestamp of the exchange rate snapshot in use (null when using static defaults). */
  exchangeRateTimestamp: string | null;
  setCountry: (code: string) => void;
  setLanguage: (lang: LanguageOption) => void;
  setCountryAndCurrency: (code: string, currency: string) => void;
  setExchangeRateTimestamp: (ts: string | null) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      countryCode: "ZA",
      currency: "ZAR",
      language: "en",
      exchangeRateTimestamp: null,
      setCountry: (code) => {
        const country = COUNTRIES.find((c) => c.code === code);
        if (country) {
          set({ countryCode: code, currency: country.currency });
        }
      },
      setLanguage: (lang) => set({ language: lang }),
      setCountryAndCurrency: (code, currency) =>
        set({ countryCode: code, currency }),
      setExchangeRateTimestamp: (ts) => set({ exchangeRateTimestamp: ts }),
    }),
    {
      name: "cappture-country",
      version: 1,
    }
  )
);

/** Get the current country option (defaults to South Africa). */
export function getSelectedCountry(): CountryOption {
  const code = useCountryStore.getState().countryCode;
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/** Get the current currency info (defaults to ZAR). */
export function getSelectedCurrency(): { code: string; symbol: string; locale: string } {
  const code = useCountryStore.getState().currency;
  return CURRENCIES[code] ?? CURRENCIES.ZAR;
}
