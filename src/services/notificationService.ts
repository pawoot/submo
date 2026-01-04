import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type NotificationSettings = Database["public"]["Tables"]["notification_settings"]["Row"];
type NotificationSettingsInsert = Database["public"]["Tables"]["notification_settings"]["Insert"];
type NotificationSettingsUpdate = Database["public"]["Tables"]["notification_settings"]["Update"];
type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export const notificationService = {
  /**
   * Get notification settings for current user
   */
  async getSettings(): Promise<NotificationSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // If no settings exist, create default settings
      if (error.code === "PGRST116") {
        return await this.createDefaultSettings();
      }
      throw error;
    }

    return data;
  },

  /**
   * Create default notification settings
   */
  async createDefaultSettings(): Promise<NotificationSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const defaultSettings: NotificationSettingsInsert = {
      user_id: user.id,
      email_enabled: true,
      email_7_days_before: true,
      email_3_days_before: true,
      email_1_day_before: true,
      email_on_due_date: true,
      email_monthly_summary: true,
      email_price_changes: true,
      push_enabled: false,
      push_7_days_before: true,
      push_3_days_before: true,
      push_1_day_before: true,
      push_on_due_date: true,
      notification_time: "09:00:00",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    };

    const { data, error } = await supabase
      .from("notification_settings")
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update notification settings
   */
  async updateSettings(updates: NotificationSettingsUpdate): Promise<NotificationSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notification_settings")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get notification history
   */
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        subscriptions (
          name,
          amount,
          currency
        )
      `)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("id", notificationId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) throw error;
  },

  /**
   * Request browser push notification permission
   */
  async requestPushPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  },

  /**
   * Check if push notifications are supported
   */
  isPushSupported(): boolean {
    return "Notification" in window && "serviceWorker" in navigator;
  },

  /**
   * Get current push permission status
   */
  getPushPermission(): NotificationPermission | null {
    if (!("Notification" in window)) {
      return null;
    }
    return Notification.permission;
  },
};