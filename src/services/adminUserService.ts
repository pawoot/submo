import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UserWithSubscriptions extends Profile {
  subscription_count: number;
  total_monthly_cost: number;
  total_yearly_cost: number;
  active_subscriptions: number;
}

export const adminUserService = {
  /**
   * Get all users with their subscription statistics
   */
  async getAllUsers(): Promise<UserWithSubscriptions[]> {
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;
    if (!profiles) return [];

    // Get subscription statistics for each user
    const usersWithStats = await Promise.all(
      profiles.map(async (profile) => {
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", profile.id);

        const activeSubscriptions = subscriptions?.filter(
          (sub) => sub.is_active
        ) || [];

        const totalMonthlyCost = activeSubscriptions.reduce((sum, sub) => {
          const price = sub.amount || 0;
          const monthlyCost =
            sub.billing_cycle === "monthly"
              ? price
              : sub.billing_cycle === "yearly"
              ? price / 12
              : sub.billing_cycle === "quarterly"
              ? price / 3
              : 0;
          return sum + monthlyCost;
        }, 0);

        const totalYearlyCost = totalMonthlyCost * 12;

        return {
          ...profile,
          subscription_count: subscriptions?.length || 0,
          total_monthly_cost: totalMonthlyCost,
          total_yearly_cost: totalYearlyCost,
          active_subscriptions: activeSubscriptions.length,
        };
      })
    );

    return usersWithStats;
  },

  /**
   * Get user by ID with detailed statistics
   */
  async getUserById(userId: string) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!profile) return null;

    // Get user's subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return {
      profile,
      subscriptions: subscriptions || [],
    };
  },

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserWithSubscriptions[]> {
    const allUsers = await this.getAllUsers();
    
    const searchLower = query.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
    );
  },
};