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
    console.log("=== getUserById DEBUG ===");
    console.log("Received userId:", userId);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("Profile query result:", profile);
    console.log("Profile error:", profileError);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw profileError;
    }

    console.log("Querying subscriptions with user_id:", userId);

    const { data: subscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("Subscriptions query result:", subscriptions);
    console.log("Subscriptions count:", subscriptions?.length || 0);
    console.log("Subscriptions error:", subsError);
    console.log("========================");

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

  async toggleAdminRole(userId: string, isAdmin: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_admin: isAdmin,
        role: isAdmin ? "admin" : "user",
      })
      .eq("id", userId);

    if (error) {
      console.error("Error toggling admin role:", error);
      throw error;
    }
  },
};