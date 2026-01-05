import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  categories?: {
    id: string;
    name_en: string;
    name_th: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
  payment_methods?: {
    id: string;
    name_en: string;
    name_th: string;
    slug: string;
    icon: string;
    color: string;
  } | null;
};

type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];

export const subscriptionService = {
  /**
   * Get all active payment methods
   */
  async getPaymentMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }

    return data as PaymentMethod[];
  },

  /**
   * Get all subscriptions for the current user
   */
  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (
          id,
          name_en,
          name_th,
          slug,
          icon,
          color
        ),
        payment_methods!payment_method_id (
          id,
          name_en,
          name_th,
          slug,
          icon,
          color
        )
      `)
      .eq("is_template", false)
      .order("next_billing_date", { ascending: true });

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    return data as unknown as Subscription[];
  },

  /**
   * Get all available categories
   */
  async getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get a single subscription by ID
   */
  async getById(id: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        categories!category_id (
          id,
          name_en,
          name_th,
          slug,
          icon,
          color
        ),
        payment_methods!payment_method_id (
          id,
          name_en,
          name_th,
          slug,
          icon,
          color
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      throw error;
    }

    return data as unknown as Subscription;
  },

  /**
   * Create a new subscription
   */
  async create(subscription: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "user_id">): Promise<Subscription> {
    const user = await authService.getCurrentUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        ...subscription,
        user_id: user.id,
        is_template: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }

    return data;
  },

  /**
   * Update an existing subscription
   */
  async update(id: string, subscription: Partial<Database["public"]["Tables"]["subscriptions"]["Update"]>): Promise<Subscription> {
    const { data, error } = await supabase
      .from("subscriptions")
      .update(subscription)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    return data as unknown as Subscription;
  },

  /**
   * Delete a subscription
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscription:", error);
      throw error;
    }
  },

  /**
   * Get subscriptions expiring soon (within days)
   */
  async getExpiringSoon(days: number = 7): Promise<Subscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("is_template", false)
      .lte("next_billing_date", futureDate.toISOString())
      .order("next_billing_date", { ascending: true });

    if (error) {
      console.error("Error fetching expiring subscriptions:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get subscriptions by category
   */
  async getByCategory(category: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("is_template", false)
      .eq("category", category)
      .order("next_billing_date", { ascending: true });

    if (error) {
      console.error("Error fetching subscriptions by category:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get total monthly cost for current user
   */
  async getTotalMonthlyCost(): Promise<number> {
    const subscriptions = await this.getAll();
    
    return subscriptions.reduce((total, sub) => {
      let monthlyCost = sub.amount;
      
      // Convert to monthly cost based on billing cycle
      switch (sub.billing_cycle) {
        case "yearly":
          monthlyCost = sub.amount / 12;
          break;
        case "quarterly":
          monthlyCost = sub.amount / 3;
          break;
        case "half-yearly":
          monthlyCost = sub.amount / 6;
          break;
        // monthly is default
      }
      
      return total + monthlyCost;
    }, 0);
  },

  /**
   * Get statistics for dashboard
   */
  async getStats() {
    const subscriptions = await this.getAll();
    const expiringSoon = await this.getExpiringSoon(7);
    const totalMonthlyCost = await this.getTotalMonthlyCost();

    // Calculate total yearly cost
    const totalYearlyCost = subscriptions.reduce((total, sub) => {
      let yearlyCost = sub.amount;
      
      switch (sub.billing_cycle) {
        case "monthly":
          yearlyCost = sub.amount * 12;
          break;
        case "quarterly":
          yearlyCost = sub.amount * 4;
          break;
        case "half-yearly":
          yearlyCost = sub.amount * 2;
          break;
        // yearly is default
      }
      
      return total + yearlyCost;
    }, 0);

    return {
      totalSubscriptions: subscriptions.length,
      totalMonthlyCost,
      totalYearlyCost,
      expiringSoon: expiringSoon.length,
      subscriptions,
    };
  },
};

/**
 * Get all subscriptions for the current user
 */
export async function getUserSubscriptions(): Promise<Subscription[]> {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon,
        color
      ),
      payment_methods!subscriptions_payment_method_id_fkey (
        id,
        name_en,
        name_th,
        slug,
        icon,
        color
      )
    `)
    .eq("user_id", user.id)
    .eq("is_template", false)
    .order("next_billing_date", { ascending: true });

  if (error) {
    console.error("Error fetching user subscriptions:", error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new subscription (optionally from a template)
 */
export async function createSubscription(
  subscription: Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Subscription> {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      ...subscription,
      user_id: user.id,
      is_template: false, // User subscriptions are NOT templates
    })
    .select(`
      *,
      categories!subscriptions_category_id_fkey (
        id,
        slug,
        name_en,
        name_th,
        icon,
        color
      ),
      payment_methods!subscriptions_payment_method_id_fkey (
        id,
        name_en,
        name_th,
        slug,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }

  return data;
}