import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Template is now just a subscription with is_template = true
export type SubscriptionTemplate = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  categories?: {
    id: string;
    slug: string;
    name_en: string;
    name_th: string;
    icon: string;
    color: string;
  } | null;
};

export const subscriptionTemplateService = {
  /**
   * Get all subscription templates (popular and regular)
   */
  async getAllTemplates(): Promise<SubscriptionTemplate[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (
          id,
          slug,
          name_en,
          name_th,
          icon,
          color
        )
      `)
      .eq("is_template", true)
      .eq("is_active", true)
      .order("popularity_score", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching subscription templates:", error);
      throw error;
    }

    return data as unknown as SubscriptionTemplate[];
  },

  /**
   * Get popular subscription templates
   */
  async getPopularTemplates(limit = 6): Promise<SubscriptionTemplate[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (
          id,
          slug,
          name_en,
          name_th,
          icon,
          color
        )
      `)
      .eq("is_template", true)
      .eq("is_active", true)
      .gte("popularity_score", 50)
      .order("popularity_score", { ascending: false })
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching popular templates:", error);
      throw error;
    }

    return data as unknown as SubscriptionTemplate[];
  },

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(categorySlug: string): Promise<SubscriptionTemplate[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (
          id,
          slug,
          name_en,
          name_th,
          icon,
          color
        )
      `)
      .eq("is_template", true)
      .eq("is_active", true)
      .eq("categories.slug", categorySlug)
      .order("popularity_score", { ascending: false });

    if (error) {
      console.error("Error fetching templates by category:", error);
      throw error;
    }

    // Filter client-side because of complex join filtering limitations
    return (data || []).filter(t => t.categories?.slug === categorySlug) as unknown as SubscriptionTemplate[];
  },

  /**
   * Get categories for templates
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("slug")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data.map(c => c.slug);
  },

  /**
   * Create a new template (Admin only)
   */
  async createTemplate(template: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>): Promise<void> {
    // Cast to any to bypass strict partial check on insert required fields
    // We assume the caller provides necessary fields
    const { error } = await supabase
      .from("subscriptions")
      .insert({
        ...template,
        is_template: true,
        is_active: true
      } as any);

    if (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  },

  /**
   * Update a template (Admin only)
   */
  async updateTemplate(id: string, updates: Partial<Database["public"]["Tables"]["subscriptions"]["Update"]>): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("id", id)
      .eq("is_template", true);

    if (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  },

  /**
   * Delete a template (Admin only)
   */
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id)
      .eq("is_template", true);

    if (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }
};