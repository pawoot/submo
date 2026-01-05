import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type MigrationReport = Database["public"]["Tables"]["migration_reports"]["Row"];
type MigrationReportRow = Database["public"]["Tables"]["migration_report_rows"]["Row"];
type AdminActionLog = Database["public"]["Tables"]["admin_actions_log"]["Row"];
type FeatureFlag = Database["public"]["Tables"]["feature_flags"]["Row"];

export interface MigrationHealth {
  status: "healthy" | "needs_attention" | "in_progress";
  total_subscriptions: number;
  successfully_mapped_percent: number;
  unmapped_categories: number;
  unmapped_payment_methods: number;
  invalid_shared_with: number;
}

export interface UnmappedRecord {
  id: string;
  entity: string;
  issue_type: string;
  subscription_name: string | null;
  legacy_value: string | null;
  current_mapped_value: string | null;
  created_at: string;
  status: string;
  record_id: string;
}

/**
 * Get migration health summary
 */
export async function getMigrationHealth(): Promise<MigrationHealth | null> {
  const { data, error } = await supabase.rpc("get_migration_health");

  if (error) {
    console.error("Error fetching migration health:", error);
    return null;
  }

  return data as MigrationHealth;
}

/**
 * Get latest migration report
 */
export async function getLatestMigrationReport(): Promise<MigrationReport | null> {
  const { data, error } = await supabase
    .from("migration_reports")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching latest migration report:", error);
    return null;
  }

  return data;
}

/**
 * Get all migration reports (paginated)
 */
export async function getMigrationReports(
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: MigrationReport[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("migration_reports")
    .select("*", { count: "exact" })
    .order("generated_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching migration reports:", error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Get unmapped records (detailed drill-down)
 */
export async function getUnmappedRecords(filters?: {
  issue_type?: string;
  entity?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<UnmappedRecord[]> {
  let query = supabase
    .from("migration_report_rows")
    .select(`
      id,
      entity,
      issue_type,
      record_id,
      details,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (filters?.issue_type) {
    query = query.eq("issue_type", filters.issue_type);
  }

  if (filters?.entity) {
    query = query.eq("entity", filters.entity);
  }

  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching unmapped records:", error);
    return [];
  }

  // Transform data for UI
  return (data || []).map((row) => {
    const details = row.details as any;
    return {
      id: row.id,
      entity: row.entity,
      issue_type: row.issue_type,
      subscription_name: details?.subscription_name || null,
      legacy_value: details?.legacy_value || null,
      current_mapped_value: details?.current_mapped_value || null,
      created_at: row.created_at,
      status: details?.status || "unresolved",
      record_id: row.record_id,
    };
  });
}

/**
 * Fix subscription category (one-click)
 */
export async function fixSubscriptionCategory(
  subscriptionId: string,
  newCategoryId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("fix_subscription_category", {
    p_subscription_id: subscriptionId,
    p_new_category_id: newCategoryId,
  });

  if (error) {
    console.error("Error fixing subscription category:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Fix subscription payment method (one-click)
 */
export async function fixSubscriptionPaymentMethod(
  subscriptionId: string,
  newPaymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("fix_subscription_payment_method", {
    p_subscription_id: subscriptionId,
    p_new_payment_method_id: newPaymentMethodId,
  });

  if (error) {
    console.error("Error fixing subscription payment method:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Re-run category backfill (unmapped only)
 */
export async function rerunCategoryBackfill(): Promise<{
  success: boolean;
  mapped_count?: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("rerun_category_backfill");

  if (error) {
    console.error("Error re-running category backfill:", error);
    return { success: false, error: error.message };
  }

  return { success: true, mapped_count: data as number };
}

/**
 * Re-run payment method backfill (unmapped only)
 */
export async function rerunPaymentMethodBackfill(): Promise<{
  success: boolean;
  mapped_count?: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("rerun_payment_method_backfill");

  if (error) {
    console.error("Error re-running payment method backfill:", error);
    return { success: false, error: error.message };
  }

  return { success: true, mapped_count: data as number };
}

/**
 * Get all feature flags
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("*")
    .order("key");

  if (error) {
    console.error("Error fetching feature flags:", error);
    return [];
  }

  return data || [];
}

/**
 * Toggle feature flag
 */
export async function toggleFeatureFlag(
  flagKey: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", flagKey);

  if (error) {
    console.error("Error toggling feature flag:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get admin action logs (audit trail)
 */
export async function getAdminActionLogs(
  page: number = 1,
  pageSize: number = 50,
  filters?: {
    admin_user_id?: string;
    action_type?: string;
    date_from?: string;
    date_to?: string;
  }
): Promise<{ data: AdminActionLog[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("admin_actions_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters?.admin_user_id) {
    query = query.eq("admin_user_id", filters.admin_user_id);
  }

  if (filters?.action_type) {
    query = query.eq("action_type", filters.action_type);
  }

  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte("created_at", filters.date_to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching admin action logs:", error);
    return { data: [], count: 0 };
  }

  return { data: data || [], count: count || 0 };
}

/**
 * Download migration report as CSV
 */
export function downloadReportAsCSV(records: UnmappedRecord[], filename: string = "migration-report.csv") {
  const headers = [
    "Entity",
    "Issue Type",
    "Subscription Name",
    "Legacy Value",
    "Current Mapped Value",
    "Status",
    "Created At",
  ];

  const csvContent = [
    headers.join(","),
    ...records.map((record) =>
      [
        record.entity,
        record.issue_type,
        record.subscription_name || "",
        record.legacy_value || "",
        record.current_mapped_value || "",
        record.status,
        record.created_at,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download migration report as JSON
 */
export function downloadReportAsJSON(records: UnmappedRecord[], filename: string = "migration-report.json") {
  const jsonContent = JSON.stringify(records, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}