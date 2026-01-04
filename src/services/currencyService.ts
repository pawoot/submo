import { supabase } from "@/integrations/supabase/client";

export interface ExchangeRate {
  [currency: string]: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr", flag: "🇨🇭" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س", flag: "🇸🇦" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" }
];

// Cache for exchange rates
let cachedRates: ExchangeRate | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

export const currencyService = {
  /**
   * Get exchange rates from API with caching
   */
  async getExchangeRates(baseCurrency: string = "USD"): Promise<ExchangeRate> {
    const now = Date.now();
    
    // Return cached rates if still valid
    if (cachedRates && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("📦 Using cached exchange rates");
      return cachedRates;
    }

    try {
      console.log(`🌐 Fetching exchange rates for ${baseCurrency}...`);
      // Using exchangerate-api.com (free tier: 1,500 requests/month)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }

      const data = await response.json();
      console.log("✅ Exchange rates fetched:", data.rates);
      cachedRates = data.rates;
      cacheTimestamp = now;
      
      return data.rates;
    } catch (error) {
      console.error("❌ Error fetching exchange rates, using fallback:", error);
      
      // Fallback to approximate rates if API fails
      return this.getFallbackRates(baseCurrency);
    }
  },

  /**
   * Fallback exchange rates (approximate, as of 2024)
   */
  getFallbackRates(baseCurrency: string = "USD"): ExchangeRate {
    const baseRates: ExchangeRate = {
      USD: 1,
      THB: 35.5,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CNY: 7.24,
      KRW: 1320,
      INR: 83.2,
      AUD: 1.52,
      CAD: 1.36,
      SGD: 1.34,
      HKD: 7.83,
      NZD: 1.64,
      SEK: 10.45,
      NOK: 10.65,
      DKK: 6.87,
      CHF: 0.88,
      MXN: 17.15,
      BRL: 4.98,
      ZAR: 18.75,
      RUB: 92.5,
      TRY: 32.5,
      PLN: 3.98,
      CZK: 22.5,
      HUF: 355,
      ILS: 3.65,
      AED: 3.67,
      SAR: 3.75,
      MYR: 4.68,
      PHP: 56.5,
      IDR: 15750,
      VND: 24500
    };

    // If base currency is not USD, convert all rates
    if (baseCurrency !== "USD") {
      const baseRate = baseRates[baseCurrency] || 1;
      const convertedRates: ExchangeRate = {};
      
      for (const [currency, rate] of Object.entries(baseRates)) {
        convertedRates[currency] = rate / baseRate;
      }
      
      return convertedRates;
    }

    return baseRates;
  },

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    console.log(`💱 convertCurrency: ${amount} ${fromCurrency} → ${toCurrency}`);
    
    if (fromCurrency === toCurrency) {
      console.log("✅ Same currency, returning original amount");
      return amount;
    }

    const rates = await this.getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      console.warn(`⚠️ Exchange rate not found for ${toCurrency}, using amount as-is`);
      return amount;
    }

    const converted = amount * rate;
    console.log(`✅ Converted: ${amount} ${fromCurrency} × ${rate} = ${converted} ${toCurrency}`);
    return converted;
  },

  /**
   * Get currency symbol
   */
  getCurrencySymbol(currencyCode: string): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  },

  /**
   * Get currency info
   */
  getCurrencyInfo(currencyCode: string): CurrencyInfo | undefined {
    return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  },

  /**
   * Format amount with currency
   */
  formatAmount(amount: number, currencyCode: string): string {
    const symbol = this.getCurrencySymbol(currencyCode);
    const formattedNumber = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `${symbol}${formattedNumber}`;
  },

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    cachedRates = null;
    cacheTimestamp = 0;
  }
};