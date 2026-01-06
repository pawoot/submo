import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number with comma separators for thousands
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | string | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || value === "") return "0";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(num)) return "0";
  
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency with symbol and comma separators
 * @param amount - Amount to format
 * @param currency - Currency code (THB, USD, etc.)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | undefined | null, currency: string = "THB"): string {
  if (amount === undefined || amount === null || amount === "") return "0";
  
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return "0";
  
  const formatted = formatNumber(num, 2);
  
  // Add currency symbol
  switch (currency) {
    case "THB":
      return `฿${formatted}`;
    case "USD":
      return `$${formatted}`;
    case "EUR":
      return `€${formatted}`;
    case "GBP":
      return `£${formatted}`;
    default:
      return `${formatted} ${currency}`;
  }
}
