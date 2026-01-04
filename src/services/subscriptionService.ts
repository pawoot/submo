import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

export const subscriptionService = {
  /**
   * Get all subscriptions for the current user
   */
  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .order("next_billing_date", { ascending: true });

    if (error) {
      console.error("Error fetching subscriptions:", error);
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
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching subscription:", error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new subscription
   */
  async create(subscription: Omit<SubscriptionInsert, "user_id">): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        ...subscription,
        user_id: user.id,
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
  async update(id: string, subscription: SubscriptionUpdate): Promise<Subscription> {
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

    return data;
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