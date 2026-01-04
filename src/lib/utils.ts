import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number with comma separators
 * @param value - Number to format
 * @returns Formatted string with commas (e.g., 1,000.00)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format currency with symbol and comma separators
 * @param value - Number to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string (e.g., $1,000.00)
 */
export function formatCurrency(value: number, currency: string = "USD"): string {
  const symbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    THB: "฿",
    CNY: "¥",
    KRW: "₩",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    HKD: "HK$",
    NZD: "NZ$",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    CHF: "Fr",
    MXN: "$",
    BRL: "R$",
    ZAR: "R",
    RUB: "₽",
    TRY: "₺",
    PLN: "zł",
    CZK: "Kč",
    HUF: "Ft",
    ILS: "₪",
    AED: "د.إ",
    SAR: "ر.س",
    MYR: "RM",
    PHP: "₱",
    IDR: "Rp",
    VND: "₫"
  };

  const symbol = symbols[currency] || currency;
  const formattedNumber = formatNumber(value);
  
  return `${symbol}${formattedNumber}`;
}
