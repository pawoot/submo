/* eslint-disable @typescript-eslint/no-empty-object-type */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_actions_log: {
        Row: {
          action_type: string
          admin_user_id: string
          affected_count: number | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_entity: string
          target_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          affected_count?: number | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_entity: string
          target_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          affected_count?: number | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_entity?: string
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_th: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_th: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_th?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_report_rows: {
        Row: {
          created_at: string | null
          details: Json | null
          entity: string
          id: string
          issue_type: string
          record_id: string
          report_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity: string
          id?: string
          issue_type: string
          record_id: string
          report_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity?: string
          id?: string
          issue_type?: string
          record_id?: string
          report_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_report_rows_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "migration_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "migration_report_rows_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_reports: {
        Row: {
          completed_at: string | null
          created_by: string | null
          details: Json | null
          failed_records: number | null
          id: string
          invalid_shared_with: number | null
          migration_name: string
          started_at: string | null
          status: string | null
          successful_records: number | null
          total_records: number | null
          unmapped_categories: number | null
          unmapped_payment_methods: number | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          details?: Json | null
          failed_records?: number | null
          id?: string
          invalid_shared_with?: number | null
          migration_name: string
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          unmapped_categories?: number | null
          unmapped_payment_methods?: number | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          details?: Json | null
          failed_records?: number | null
          id?: string
          invalid_shared_with?: number | null
          migration_name?: string
          started_at?: string | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          unmapped_categories?: number | null
          unmapped_payment_methods?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "migration_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_1_day_before: boolean | null
          email_3_days_before: boolean | null
          email_7_days_before: boolean | null
          email_enabled: boolean | null
          email_monthly_summary: boolean | null
          email_on_due_date: boolean | null
          email_price_changes: boolean | null
          id: string
          notification_time: string | null
          push_1_day_before: boolean | null
          push_3_days_before: boolean | null
          push_7_days_before: boolean | null
          push_enabled: boolean | null
          push_on_due_date: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_1_day_before?: boolean | null
          email_3_days_before?: boolean | null
          email_7_days_before?: boolean | null
          email_enabled?: boolean | null
          email_monthly_summary?: boolean | null
          email_on_due_date?: boolean | null
          email_price_changes?: boolean | null
          id?: string
          notification_time?: string | null
          push_1_day_before?: boolean | null
          push_3_days_before?: boolean | null
          push_7_days_before?: boolean | null
          push_enabled?: boolean | null
          push_on_due_date?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_1_day_before?: boolean | null
          email_3_days_before?: boolean | null
          email_7_days_before?: boolean | null
          email_enabled?: boolean | null
          email_monthly_summary?: boolean | null
          email_on_due_date?: boolean | null
          email_price_changes?: boolean | null
          id?: string
          notification_time?: string | null
          push_1_day_before?: boolean | null
          push_3_days_before?: boolean | null
          push_7_days_before?: boolean | null
          push_enabled?: boolean | null
          push_on_due_date?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          subscription_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          subscription_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          subscription_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          color: string
          created_at: string | null
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name_en: string
          name_th: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          name_en: string
          name_th: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_th?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          kyc_verified: boolean | null
          last_name: string | null
          phone: string | null
          preferred_currency: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferred_currency?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          kyc_verified?: boolean | null
          last_name?: string | null
          phone?: string | null
          preferred_currency?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          billing_cycle: string
          card_last_4: string | null
          category: string | null
          category_id: string
          created_at: string | null
          currency: string
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          logo_url: string | null
          name: string
          next_billing_date: string
          notes: string | null
          payment_method: string | null
          payment_method_id: string | null
          popularity_score: number | null
          remind_3_days_before: boolean | null
          remind_7_days_before: boolean | null
          reminder_days: number | null
          reminder_enabled: boolean | null
          shared_with: string[] | null
          start_date: string | null
          template_id: string | null
          updated_at: string | null
          usage_count: number | null
          usage_frequency: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          billing_cycle: string
          card_last_4?: string | null
          category?: string | null
          category_id: string
          created_at?: string | null
          currency?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          logo_url?: string | null
          name: string
          next_billing_date: string
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          popularity_score?: number | null
          remind_3_days_before?: boolean | null
          remind_7_days_before?: boolean | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          shared_with?: string[] | null
          start_date?: string | null
          template_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_frequency?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          billing_cycle?: string
          card_last_4?: string | null
          category?: string | null
          category_id?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          logo_url?: string | null
          name?: string
          next_billing_date?: string
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          popularity_score?: number | null
          remind_3_days_before?: boolean | null
          remind_7_days_before?: boolean | null
          reminder_days?: number | null
          reminder_enabled?: boolean | null
          shared_with?: string[] | null
          start_date?: string | null
          template_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_frequency?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_bulk_fix_categories: {
        Args: { p_new_category_id: string; p_old_category_text: string }
        Returns: Json
      }
      admin_fix_subscription_category: {
        Args: { p_new_category_id: string; p_subscription_id: string }
        Returns: Json
      }
      admin_fix_subscription_payment_method: {
        Args: { p_new_payment_method_id: string; p_subscription_id: string }
        Returns: Json
      }
      generate_migration_report: { Args: never; Returns: string }
      get_migration_health: { Args: never; Returns: Json }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_affected_count?: number
          p_after_state?: Json
          p_before_state?: Json
          p_metadata?: Json
          p_target_entity: string
          p_target_id?: string
        }
        Returns: string
      }
      rerun_category_backfill: {
        Args: never
        Returns: {
          still_unmapped: number
          successfully_mapped: number
          total_attempted: number
        }[]
      }
      rerun_payment_method_backfill: {
        Args: never
        Returns: {
          still_unmapped: number
          successfully_mapped: number
          total_attempted: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
