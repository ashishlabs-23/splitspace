export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  defaultRateToINR: number;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", defaultRateToINR: 1.0 },
  { code: "USD", name: "US Dollar", symbol: "$", defaultRateToINR: 86.5 },
  { code: "EUR", name: "Euro", symbol: "€", defaultRateToINR: 92.0 },
  { code: "GBP", name: "British Pound", symbol: "£", defaultRateToINR: 108.0 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", defaultRateToINR: 23.5 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", defaultRateToINR: 64.0 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", defaultRateToINR: 0.58 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", defaultRateToINR: 56.0 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", defaultRateToINR: 62.0 },
  { code: "THB", name: "Thai Baht", symbol: "฿", defaultRateToINR: 2.5 },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  THB: "฿",
};

export function currencySymbol(c: string = "INR"): string {
  return CURRENCY_SYMBOLS[c.toUpperCase()] || c;
}

export function formatMoney(amount: number, currency: string = "INR"): string {
  const sym = currencySymbol(currency);
  const formattedNum = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${sym}${formattedNum}`;
}

export function estimateExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (!fromCurrency || !toCurrency || fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return 1.0;

  const fromMeta = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency.toUpperCase());
  const toMeta = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency.toUpperCase());

  const fromToINR = fromMeta ? fromMeta.defaultRateToINR : 1.0;
  const toToINR = toMeta ? toMeta.defaultRateToINR : 1.0;

  return +(fromToINR / toToINR).toFixed(4);
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (!amount || !fromCurrency || !toCurrency || fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;
  const rate = estimateExchangeRate(fromCurrency, toCurrency);
  return Math.round(amount * rate * 100) / 100;
}

