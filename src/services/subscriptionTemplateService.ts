import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SubscriptionTemplate = {
  id: string;
  name: string;
  category_id: string;
  default_amount: number; // Keep this for API compatibility
  currency: string;
  billing_cycle: "monthly" | "yearly" | "quarterly" | "half-yearly";
  website_url: string | null;
  description: string | null;
  usage_count: number;
  is_active: boolean;
  categories: {
    id: string;
    name: string;
    slug: string;
    name_en?: string;
    name_th?: string;
    color?: string;
    icon?: string;
  } | null;
  // Compatibility fields
  amount?: number; // Maps to database 'amount' column
  icon_url?: string;
};

export const subscriptionTemplateService = {
  // Create a new template
  async createTemplate(template: Partial<SubscriptionTemplate>): Promise<SubscriptionTemplate> {
    // Map default_amount to amount for database
    const dbPayload: any = {
      name: template.name,
      category_id: template.category_id,
      amount: template.default_amount ?? template.amount ?? 0, // Use 'amount' column
      currency: template.currency,
      billing_cycle: template.billing_cycle,
      website_url: template.website_url ?? template.icon_url,
      description: template.description,
      is_template: true,
      usage_count: 0,
      popularity_score: 0
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .insert(dbPayload)
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          name_en,
          name_th,
          color,
          icon
        )
      `)
      .single();

    if (error) throw error;
    return this.mapResponse(data);
  },

  // Update an existing template
  async updateTemplate(id: string, updates: Partial<SubscriptionTemplate>): Promise<SubscriptionTemplate> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.category_id) updateData.category_id = updates.category_id;
    
    // Handle amount field mapping
    if (updates.default_amount !== undefined) {
      updateData.amount = updates.default_amount;
    } else if (updates.amount !== undefined) {
      updateData.amount = updates.amount;
    }
    
    if (updates.currency) updateData.currency = updates.currency;
    if (updates.billing_cycle) updateData.billing_cycle = updates.billing_cycle;
    
    if (updates.website_url !== undefined) {
      updateData.website_url = updates.website_url;
    } else if (updates.icon_url !== undefined) {
      updateData.website_url = updates.icon_url;
    }

    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          name_en,
          name_th,
          color,
          icon
        )
      `)
      .single();

    if (error) throw error;
    return this.mapResponse(data);
  },

  // Delete a template
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get all templates (admin use)
  async getAllTemplates(): Promise<SubscriptionTemplate[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          name_en,
          name_th,
          color,
          icon
        )
      `)
      .eq("is_template", true)
      .order("usage_count", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapResponse);
  },

  // Helper to map DB response to type
  mapResponse(item: any): SubscriptionTemplate {
    return {
      id: item.id,
      name: item.name,
      category_id: item.category_id,
      default_amount: item.amount, // Map 'amount' to 'default_amount' for API
      currency: item.currency,
      billing_cycle: item.billing_cycle,
      website_url: item.website_url,
      description: item.description,
      usage_count: item.usage_count || 0,
      is_active: item.is_active ?? true,
      categories: item.categories ? {
        id: item.categories.id,
        name: item.categories.name,
        slug: item.categories.slug || "",
        name_en: item.categories.name_en,
        name_th: item.categories.name_th,
        color: item.categories.color,
        icon: item.categories.icon
      } : null,
      // Backwards compatibility
      amount: item.amount,
      icon_url: item.website_url
    };
  },

  // Fetch top 10 popular templates
  async getPopularTemplates(limit = 10): Promise<SubscriptionTemplate[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories (
          id,
          name,
          slug,
          name_en,
          name_th,
          color,
          icon
        )
      `)
      .eq("is_template", true)
      .order("usage_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(this.mapResponse);
  },

  // Fetch all templates grouped by category
  async getAllTemplatesByCategory(): Promise<Record<string, SubscriptionTemplate[]>> {
    const templates = await this.getAllTemplates();

    // Group by category
    const grouped: Record<string, SubscriptionTemplate[]> = {};
    templates.forEach(template => {
      const categoryName = template.categories?.name || "Other";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(template);
    });

    return grouped;
  },
  
  // Increment usage count when template is selected
  async incrementUsageCount(templateId: string): Promise<void> {
    // Use direct update to avoid RPC type issues
    const { data } = await supabase
      .from("subscriptions")
      .select("usage_count")
      .eq("id", templateId)
      .single();
      
    if (data) {
      await supabase
        .from("subscriptions")
        .update({ usage_count: (data.usage_count || 0) + 1 })
        .eq("id", templateId);
    }
  },

  // Existing method alias
  async getAll(): Promise<SubscriptionTemplate[]> {
    return this.getAllTemplates();
  },
};