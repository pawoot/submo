import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { currencyService } from "@/services/currencyService";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export const profileService = {
  /**
   * Get current user's profile
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // If profile doesn't exist, create it
      if (error.code === "PGRST116") {
        const newProfile: ProfileInsert = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        return createdProfile;
      }
      throw error;
    }

    return data;
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Also update user metadata if full_name or avatar_url changed
    if (updates.full_name || updates.avatar_url) {
      await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        }
      });
    }

    return data;
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<string> {
    void file;
    // Neon replaces the database and authentication layers, not object
    // storage. Keep the UI safe until an object-storage provider is chosen.
    throw new Error("การอัปโหลดรูปโปรไฟล์ยังไม่พร้อมใช้งานระหว่างย้ายไป Neon");
  },

  /**
   * Change user password
   */
  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  },

  /**
   * Delete user account
   * Note: This deletes profile data but cannot delete the auth user from client-side
   * Auth user deletion requires admin privileges or server-side function
   */
  async deleteAccount(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Delete notification settings
    await supabase
      .from("notification_settings")
      .delete()
      .eq("user_id", user.id);

    // Delete notifications
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    // Delete subscriptions (will cascade to related data)
    await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id);

    // Delete profile (last)
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) throw profileError;

    // Sign out user
    await supabase.auth.signOut();
    
    // Note: Auth user still exists in auth.users table
    // User should contact support or use admin dashboard to complete deletion
  },

  /**
   * Get user statistics
   */
  async getUserStats(preferredCurrency: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalMonthlySpend: number;
    totalYearlySpend: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    const now = new Date();
    const activeSubscriptions = subscriptions?.filter(sub => {
      const nextBilling = new Date(sub.next_billing_date);
      return nextBilling >= now;
    }) || [];

    const calculateMonthlyCost = (sub: typeof subscriptions[0]): number => {
      switch (sub.billing_cycle) {
        case "monthly": return sub.amount;
        case "yearly": return sub.amount / 12;
        case "quarterly": return sub.amount / 3;
        case "half-yearly": return sub.amount / 6;
        default: return sub.amount;
      }
    };

    const convertedMonthlyCosts = await Promise.all(
      activeSubscriptions.map(async (subscription) => {
        const convertedAmount = await currencyService.convertCurrency(
          subscription.amount,
          subscription.currency || preferredCurrency,
          preferredCurrency,
        );
        return calculateMonthlyCost({ ...subscription, amount: convertedAmount });
      }),
    );
    const totalMonthlySpend = convertedMonthlyCosts.reduce((sum, cost) => sum + cost, 0);

    const totalYearlySpend = totalMonthlySpend * 12;

    return {
      totalSubscriptions: subscriptions?.length || 0,
      activeSubscriptions: activeSubscriptions.length,
      totalMonthlySpend,
      totalYearlySpend,
    };
  },

  /**
   * Update preferred currency
   */
  async updatePreferredCurrency(currency: string): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ preferred_currency: currency })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};
