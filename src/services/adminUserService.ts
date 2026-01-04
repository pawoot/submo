import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];

export interface UserWithSubscriptions extends Profile {
  subscription_count: number;
  total_monthly_cost: number;
}

export const adminUserService = {
  async getAllUsers(): Promise<UserWithSubscriptions[]> {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*, subscriptions(*)")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching users:", profilesError);
      throw profilesError;
    }

    const usersWithStats = profiles.map((profile) => {
      const subscriptions = Array.isArray(profile.subscriptions)
        ? profile.subscriptions
        : [];

      const activeSubscriptions = subscriptions.filter(
        (sub: Subscription) => sub.is_active !== false
      );

      const totalMonthlyCost = activeSubscriptions.reduce((sum, sub: Subscription) => {
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

      return {
        ...profile,
        subscription_count: subscriptions.length,
        total_monthly_cost: totalMonthlyCost,
      };
    });

    return usersWithStats;
  },

  async getUserById(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw profileError;
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      return {
        profile,
        subscriptions: [],
      };
    }

    return {
      profile,
      subscriptions: subscriptions || [],
    };
  },

  async getUserStats(userId: string) {
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }

    const allSubscriptions = subscriptions || [];
    const activeSubscriptions = allSubscriptions.filter(
      (sub) => sub.is_active !== false
    );

    const totalMonthly = activeSubscriptions.reduce((sum, sub) => {
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

    return {
      total: allSubscriptions.length,
      active: activeSubscriptions.length,
      monthlyCost: totalMonthly,
      yearlyCost: totalMonthly * 12,
    };
  },
};