import { supabase } from "@/integrations/supabase/client";
import { currencyService } from "./currencyService";

export interface DashboardStats {
  totalUsers: number;
  totalSubscriptions: number;
  totalMonthlyRevenue: number;
  totalYearlyRevenue: number;
  activeSubscriptions: number;
  newUsersThisMonth: number;
  topTemplates: Array<{
    name: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
}

export const adminDashboardService = {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total subscriptions
      const { data: subscriptions, count: totalSubscriptions } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact" });

      // Calculate revenue (convert all to THB)
      let totalMonthlyRevenue = 0;
      let activeSubscriptions = 0;

      for (const sub of subscriptions || []) {
        if (sub.is_active) {
          activeSubscriptions++;
          const amount = sub.amount || 0;
          const currency = sub.currency || "THB";
          
          // Convert to THB
          const amountInTHB = await currencyService.convertCurrency(
            amount,
            currency,
            "THB"
          );
          
          // Calculate monthly cost in THB
          const monthlyCost =
            sub.billing_cycle === "monthly"
              ? amountInTHB
              : sub.billing_cycle === "yearly"
              ? amountInTHB / 12
              : sub.billing_cycle === "quarterly"
              ? amountInTHB / 3
              : 0;
          totalMonthlyRevenue += monthlyCost;
        }
      }

      const totalYearlyRevenue = totalMonthlyRevenue * 12;

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      // Get top templates
      const { data: templateData } = await supabase
        .from("subscriptions")
        .select("name")
        .not("name", "is", null);

      const templateCounts: { [key: string]: number } = {};
      templateData?.forEach((sub) => {
        const name = sub.name || "Unknown";
        templateCounts[name] = (templateCounts[name] || 0) + 1;
      });

      const topTemplates = Object.entries(templateCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Get user growth (last 6 months)
      const { data: userGrowthData } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

      const monthCounts: { [key: string]: number } = {};
      userGrowthData?.forEach((user) => {
        const month = new Date(user.created_at).toLocaleDateString("th-TH", {
          year: "numeric",
          month: "short",
        });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const userGrowth = Object.entries(monthCounts).map(([date, count]) => ({
        date,
        count,
      }));

      // Get revenue by month (last 6 months)
      const revenueByMonth = userGrowth.map((item) => ({
        month: item.date,
        revenue: totalMonthlyRevenue, // Simplified - in real app, calculate per month
      }));

      return {
        totalUsers: totalUsers || 0,
        totalSubscriptions: totalSubscriptions || 0,
        totalMonthlyRevenue,
        totalYearlyRevenue,
        activeSubscriptions,
        newUsersThisMonth: newUsersThisMonth || 0,
        topTemplates,
        userGrowth,
        revenueByMonth,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    try {
      // Get recent subscriptions
      const { data: recentSubs } = await supabase
        .from("subscriptions")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      return {
        recentSubscriptions: recentSubs || [],
        recentUsers: recentUsers || [],
      };
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      throw error;
    }
  },
};