import Papa from "papaparse";
import type { Database } from "@/integrations/supabase/types";

export interface ParsedTransaction {
  rawText: string;
  date?: Date;
  amount?: number;
  description?: string;
  confidence: "high" | "medium" | "low";
}

export interface MappedSubscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: "monthly" | "yearly" | "weekly" | "daily";
  next_billing_date: string;
  category_id?: string;
  payment_method_id?: string;
  description?: string;
  confidence: "high" | "medium" | "low";
  rawTransaction: ParsedTransaction;
}

/**
 * Column mapping keywords for different banks/formats
 */
const COLUMN_KEYWORDS = {
  date: ["date", "time", "transaction date", "วัน", "เวลา", "วันที่"],
  description: [
    "description",
    "memo",
    "details",
    "transaction",
    "รายการ",
    "merchant",
    "payee",
  ],
  amount: [
    "amount",
    "debit",
    "withdrawal",
    "จำนวนเงิน",
    "ถอน",
    "รายจ่าย",
    "value",
  ],
  credit: ["credit", "deposit", "รับเงิน", "ฝาก"],
};

/**
 * Known subscription service patterns
 */
const SUBSCRIPTION_PATTERNS = [
  { pattern: /netflix/i, name: "Netflix" },
  { pattern: /spotify/i, name: "Spotify" },
  { pattern: /apple.*music/i, name: "Apple Music" },
  { pattern: /youtube.*premium/i, name: "YouTube Premium" },
  { pattern: /amazon.*prime/i, name: "Amazon Prime" },
  { pattern: /disney/i, name: "Disney+" },
  { pattern: /hbo/i, name: "HBO Max" },
  { pattern: /adobe/i, name: "Adobe Creative Cloud" },
  { pattern: /microsoft.*365/i, name: "Microsoft 365" },
  { pattern: /dropbox/i, name: "Dropbox" },
  { pattern: /google.*one/i, name: "Google One" },
  { pattern: /icloud/i, name: "iCloud" },
  { pattern: /canva/i, name: "Canva Pro" },
  { pattern: /notion/i, name: "Notion" },
  { pattern: /zoom/i, name: "Zoom" },
];

/**
 * Patterns to exclude (non-subscription transactions)
 */
const EXCLUDE_PATTERNS = [
  /transfer/i,
  /โอนเงิน/i,
  /atm/i,
  /7-eleven/i,
  /family mart/i,
  /lotus/i,
  /big c/i,
  /tops/i,
  /interest/i,
  /ดอกเบี้ย/i,
  /fee/i,
  /ค่าธรรมเนียม/i,
];

/**
 * Detect column indices from CSV headers
 */
function detectColumns(headers: string[]): {
  dateIndex: number;
  descriptionIndex: number;
  amountIndex: number;
} {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

  const dateIndex = normalizedHeaders.findIndex((h) =>
    COLUMN_KEYWORDS.date.some((k) => h.includes(k))
  );

  const descriptionIndex = normalizedHeaders.findIndex((h) =>
    COLUMN_KEYWORDS.description.some((k) => h.includes(k))
  );

  const amountIndex = normalizedHeaders.findIndex((h) =>
    COLUMN_KEYWORDS.amount.some((k) => h.includes(k))
  );

  return { dateIndex, descriptionIndex, amountIndex };
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  // Try common formats
  const formats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];

  for (const format of formats) {
    const match = dateStr.trim().match(format);
    if (match) {
      const [, p1, p2, p3] = match;
      // Detect format by year position
      if (p3.length === 4) {
        // DD/MM/YYYY or DD-MM-YYYY
        const date = new Date(parseInt(p3), parseInt(p2) - 1, parseInt(p1));
        if (!isNaN(date.getTime())) return date;
      } else if (p1.length === 4) {
        // YYYY-MM-DD
        const date = new Date(parseInt(p1), parseInt(p2) - 1, parseInt(p3));
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  // Fallback to native Date parsing
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Clean and parse amount
 */
function parseAmount(amountStr: string): number | undefined {
  if (!amountStr) return undefined;

  // Remove currency symbols, commas, and spaces
  const cleaned = amountStr
    .replace(/[฿$€£,\s]/g, "")
    .replace(/\(([0-9.]+)\)/, "-$1") // Handle (123.45) as negative
    .trim();

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? undefined : Math.abs(amount);
}

/**
 * Match transaction description to known subscription services
 */
function matchSubscription(description: string): {
  name: string;
  confidence: "high" | "medium" | "low";
} {
  for (const { pattern, name } of SUBSCRIPTION_PATTERNS) {
    if (pattern.test(description)) {
      return { name, confidence: "high" };
    }
  }

  // Generic fallback: clean up the description
  const cleaned = description
    .replace(/\d+/g, "") // Remove numbers
    .replace(/[^a-zA-Z\s]/g, "") // Remove special chars
    .trim()
    .substring(0, 50);

  return { name: cleaned || "Unknown Service", confidence: "low" };
}

/**
 * Check if transaction should be excluded
 */
function shouldExclude(description: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(description));
}

/**
 * Parse CSV file and extract potential subscriptions
 */
export async function parseCSV(
  file: File
): Promise<{ transactions: ParsedTransaction[]; error?: string }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            transactions: [],
            error: `CSV parsing error: ${results.errors[0].message}`,
          });
          return;
        }

        const headers = results.meta.fields || [];
        const { dateIndex, descriptionIndex, amountIndex } =
          detectColumns(headers);

        if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
          resolve({
            transactions: [],
            error:
              "Could not detect required columns (Date, Description, Amount). Please check your CSV format.",
          });
          return;
        }

        const transactions: ParsedTransaction[] = results.data
          .map((row: any) => {
            const dateStr = row[headers[dateIndex]];
            const description = row[headers[descriptionIndex]];
            const amountStr = row[headers[amountIndex]];

            return {
              rawText: `${dateStr} | ${description} | ${amountStr}`,
              date: parseDate(dateStr),
              amount: parseAmount(amountStr),
              description: description?.trim(),
              confidence: "medium" as const,
            };
          })
          .filter((t) => t.date && t.amount && t.description);

        resolve({ transactions });
      },
      error: (error) => {
        resolve({
          transactions: [],
          error: `Failed to read CSV: ${error.message}`,
        });
      },
    });
  });
}

/**
 * Map transactions to subscription format
 */
export function mapToSubscriptions(
  transactions: ParsedTransaction[]
): MappedSubscription[] {
  const mapped: MappedSubscription[] = [];

  for (const transaction of transactions) {
    if (!transaction.description || shouldExclude(transaction.description)) {
      continue;
    }

    const { name, confidence } = matchSubscription(transaction.description);

    mapped.push({
      id: `temp-${Date.now()}-${Math.random()}`,
      name,
      amount: transaction.amount || 0,
      billing_cycle: "monthly",
      next_billing_date: transaction.date
        ? transaction.date.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      confidence,
      rawTransaction: transaction,
    });
  }

  return mapped;
}

/**
 * Validate and prepare subscriptions for database insert
 */
export function prepareForDatabase(
  subscriptions: MappedSubscription[],
  userId: string
): Database["public"]["Tables"]["subscriptions"]["Insert"][] {
  return subscriptions.map((sub) => ({
    user_id: userId,
    name: sub.name,
    amount: sub.amount,
    currency: "THB",
    billing_cycle: sub.billing_cycle,
    next_billing_date: sub.next_billing_date,
    category_id: sub.category_id || null,
    payment_method_id: sub.payment_method_id || null,
    description: sub.description || null,
    is_active: true,
    reminder_enabled: true,
    reminder_days_before: 3,
  }));
}