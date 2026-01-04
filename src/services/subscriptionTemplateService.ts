import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionTemplate = Database["public"]["Tables"]["subscription_templates"]["Row"];
type SubscriptionTemplateInsert = Database["public"]["Tables"]["subscription_templates"]["Insert"];
type SubscriptionTemplateUpdate = Database["public"]["Tables"]["subscription_templates"]["Update"];

export const subscriptionTemplateService = {
  /**
   * Get all active templates
   */
  async getAllTemplates() {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as SubscriptionTemplate[];
  },

  /**
   * Get popular templates (for Quick Add section)
   */
  async getPopularTemplates(limit: number = 6) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("*")
      .eq("is_active", true)
      .eq("is_popular", true)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as SubscriptionTemplate[];
  },

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("*")
      .eq("is_active", true)
      .eq("category", category)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as SubscriptionTemplate[];
  },

  /**
   * Search templates by name
   */
  async searchTemplates(query: string) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("*")
      .eq("is_active", true)
      .ilike("name", `%${query}%`)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as SubscriptionTemplate[];
  },

  /**
   * Get a single template by ID
   */
  async getTemplateById(id: string) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as SubscriptionTemplate;
  },

  /**
   * Create a new template (Admin only)
   */
  async createTemplate(template: SubscriptionTemplateInsert) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data as SubscriptionTemplate;
  },

  /**
   * Update a template (Admin only)
   */
  async updateTemplate(id: string, updates: SubscriptionTemplateUpdate) {
    const { data, error } = await supabase
      .from("subscription_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as SubscriptionTemplate;
  },

  /**
   * Delete a template (Admin only)
   */
  async deleteTemplate(id: string) {
    const { error } = await supabase
      .from("subscription_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Get all unique categories
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("subscription_templates")
      .select("category")
      .eq("is_active", true);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map((item) => item.category))];
    return categories.sort();
  },
};