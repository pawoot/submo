import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Template is now just a subscription with is_template = true
export type SubscriptionTemplate = Tables<"subscriptions">;

/**
 * Get all subscription templates (popular and regular)
 */
export async function getSubscriptionTemplates(): Promise<SubscriptionTemplate[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon
      )
    `)
    .eq("is_template", true)
    .order("popularity_score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching subscription templates:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get popular subscription templates (popularity_score >= 100)
 */
export async function getPopularTemplates(): Promise<SubscriptionTemplate[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon
      )
    `)
    .eq("is_template", true)
    .gte("popularity_score", 100)
    .order("popularity_score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching popular templates:", error);
    throw error;
  }

  return data || [];
}

/**
 * Search subscription templates by name
 */
export async function searchTemplates(query: string): Promise<SubscriptionTemplate[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon
      )
    `)
    .eq("is_template", true)
    .ilike("name", `%${query}%`)
    .order("popularity_score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error searching templates:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get subscription template by ID
 */
export async function getTemplateById(id: string): Promise<SubscriptionTemplate | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon
      )
    `)
    .eq("id", id)
    .eq("is_template", true)
    .single();

  if (error) {
    console.error("Error fetching template:", error);
    return null;
  }

  return data;
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(categoryId: string): Promise<SubscriptionTemplate[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon
      )
    `)
    .eq("is_template", true)
    .eq("category_id", categoryId)
    .order("popularity_score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching templates by category:", error);
    throw error;
  }

  return data || [];
}