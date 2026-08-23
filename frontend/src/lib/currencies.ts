export interface CurrencyMeta {
  code: string;
  name: string;
  symbol: string;
  defaultRateToINR: number;
}

export const SUPPORTED_CURRENCIES: CurrencyMeta[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", defaultRateToINR: 1.0 },
  { code: "USD", name: "US Dollar", symbol: "$", defaultRateToINR: 86.8 },
  { code: "EUR", name: "Euro", symbol: "€", defaultRateToINR: 92.4 },
  { code: "GBP", name: "British Pound", symbol: "£", defaultRateToINR: 109.8 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", defaultRateToINR: 23.6 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", defaultRateToINR: 64.8 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", defaultRateToINR: 0.57 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", defaultRateToINR: 56.4 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", defaultRateToINR: 62.2 },
  { code: "THB", name: "Thai Baht", symbol: "฿", defaultRateToINR: 2.52 },
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

// In-memory & local-cached live exchange rate store
const liveRatesCache: Record<string, Record<string, number>> = {};
let lastFetchTimestamp: number = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

// Load cached rates from localStorage if available
if (typeof window !== "undefined") {
  try {
    const cached = localStorage.getItem("splitspace_live_rates");
    const cachedTime = localStorage.getItem("splitspace_live_rates_time");
    if (cached) {
      Object.assign(liveRatesCache, JSON.parse(cached));
    }
    if (cachedTime) {
      lastFetchTimestamp = parseInt(cachedTime, 10) || 0;
    }
  } catch {}
}

/**
 * Fetches real-time live currency exchange rates from open live FX endpoints
 */
export async function fetchLiveExchangeRates(baseCurrency: string = "USD"): Promise<Record<string, number>> {
  const base = baseCurrency.toUpperCase();
  const now = Date.now();

  if (liveRatesCache[base] && now - lastFetchTimestamp < CACHE_TTL_MS) {
    return liveRatesCache[base];
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      cache: "default",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.rates) {
      liveRatesCache[base] = data.rates;
      lastFetchTimestamp = now;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("splitspace_live_rates", JSON.stringify(liveRatesCache));
          localStorage.setItem("splitspace_live_rates_time", String(now));
        } catch {}
      }
      return data.rates;
    }
  } catch (err) {
    console.warn("Could not fetch real-time live FX rates, using fallback reference rates:", err);
  }

  return liveRatesCache[base] || {};
}

// Auto-seed rates in background on client startup
if (typeof window !== "undefined") {
  setTimeout(() => {
    fetchLiveExchangeRates("USD").catch(() => {});
  }, 1000);
}

/**
 * Calculates the exchange rate between two currencies using live rates where available
 */
export function estimateExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (!fromCurrency || !toCurrency || fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1.0;
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // 1. Direct lookup from live cache if base matches
  if (liveRatesCache[from] && liveRatesCache[from][to]) {
    return +(liveRatesCache[from][to]).toFixed(4);
  }

  // 2. Cross-rate calculation via USD base in live cache
  if (liveRatesCache["USD"]) {
    const usdRates = liveRatesCache["USD"];
    const fromToUsd = from === "USD" ? 1.0 : usdRates[from] ? 1 / usdRates[from] : null;
    const usdToTarget = to === "USD" ? 1.0 : usdRates[to] ?? null;

    if (fromToUsd !== null && usdToTarget !== null) {
      return +(fromToUsd * usdToTarget).toFixed(4);
    }
  }

  // 3. Fallback to standard reference table
  const fromMeta = SUPPORTED_CURRENCIES.find((c) => c.code === from);
  const toMeta = SUPPORTED_CURRENCIES.find((c) => c.code === to);

  const fromToINR = fromMeta ? fromMeta.defaultRateToINR : 1.0;
  const toToINR = toMeta ? toMeta.defaultRateToINR : 1.0;

  return +(fromToINR / toToINR).toFixed(4);
}

/**
 * Converts an amount from one currency to another using real-time rates
 */
export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (!amount || !fromCurrency || !toCurrency || fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }
  const rate = estimateExchangeRate(fromCurrency, toCurrency);
  return Math.round(amount * rate * 100) / 100;
}
