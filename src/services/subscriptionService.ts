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
   * Get all subscriptions (Admin/General use)
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
   * Get subscriptions for the CURRENT LOGGED-IN USER
   */
  async getUserSubscriptions(): Promise<Subscription[]> {
    const user = await authService.getCurrentUser();
    if (!user) {
      // Return empty if no user, instead of throwing
      return [];
    }

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
      .eq("user_id", user.id)
      .eq("is_template", false)
      .order("next_billing_date", { ascending: true });

    if (error) {
      console.error("Error fetching user subscriptions:", error);
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
  async createSubscription(subscription: Omit<Database["public"]["Tables"]["subscriptions"]["Insert"], "id" | "created_at" | "user_id">): Promise<Subscription> {
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

    return data as unknown as Subscription;
  },

  /**
   * Update an existing subscription
   */
  async updateSubscription(id: string, subscription: Partial<Database["public"]["Tables"]["subscriptions"]["Update"]>): Promise<Subscription> {
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
   * Calculate next renewal date (Synchronous Helper)
   */
  getNextRenewalDate(billingCycle: string, currentBillingDate: string): string {
    const date = new Date(currentBillingDate);
    const now = new Date();
    
    // If date is future, that's it
    if (date > now) {
      return date.toISOString();
    }

    // Otherwise calculate next cycle
    while (date <= now) {
      if (billingCycle === "monthly") {
        date.setMonth(date.getMonth() + 1);
      } else if (billingCycle === "yearly") {
        date.setFullYear(date.getFullYear() + 1);
      } else if (billingCycle === "quarterly") {
        date.setMonth(date.getMonth() + 3);
      } else if (billingCycle === "weekly") {
        date.setDate(date.getDate() + 7);
      } else {
        // Default fallback
        date.setMonth(date.getMonth() + 1);
      }
    }
    
    return date.toISOString();
  },
};