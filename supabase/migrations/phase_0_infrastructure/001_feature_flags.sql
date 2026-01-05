-- ============================================================================
-- Phase 0.1: Feature Flags Table
-- ============================================================================
-- Purpose: Central control for gradual feature rollout with instant rollback
-- Safety: Read-only for normal users, write-only for admins
-- ============================================================================

-- Create feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
BEFORE UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION update_feature_flags_updated_at();

-- Insert initial feature flags (ALL DISABLED by default)
INSERT INTO feature_flags (key, enabled, rollout_percentage, description) VALUES
  ('use_new_dashboard_reads', false, 0, 'Use new schema for dashboard queries (category_id, payment_method_id FK joins)'),
  ('use_new_subscription_reads', false, 0, 'Use new schema for subscription list/detail reads'),
  ('use_new_shares_model', false, 0, 'Read sharing data from subscription_shares table instead of shared_with array'),
  ('use_new_reminders_model', false, 0, 'Use reminder_enabled_v2 + reminder_days_array instead of legacy reminder fields')
ON CONFLICT (key) DO NOTHING;

-- Helper function to check feature flag (optional - can also query directly in app)
CREATE OR REPLACE FUNCTION get_feature_flag(flag_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  flag_enabled BOOLEAN;
BEGIN
  SELECT enabled INTO flag_enabled
  FROM feature_flags
  WHERE key = flag_key;
  
  RETURN COALESCE(flag_enabled, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = true;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Check a flag in SQL:
-- SELECT get_feature_flag('use_new_dashboard_reads');

-- Check a flag in app (TypeScript):
-- const { data } = await supabase
--   .from('feature_flags')
--   .select('enabled')
--   .eq('key', 'use_new_dashboard_reads')
--   .single();
-- const isEnabled = data?.enabled ?? false;

-- Enable a flag (admin only):
-- UPDATE feature_flags SET enabled = true WHERE key = 'use_new_dashboard_reads';

-- Gradual rollout (10% of users):
-- UPDATE feature_flags 
-- SET enabled = true, rollout_percentage = 10 
-- WHERE key = 'use_new_dashboard_reads';

-- INSTANT ROLLBACK (emergency):
-- UPDATE feature_flags SET enabled = false WHERE key = 'use_new_dashboard_reads';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies will be added in Phase 6 (after testing)
-- 2. Normal users: read-only access
-- 3. Admins: full access
-- 4. Feature flags default to DISABLED for safety
-- 5. rollout_percentage can be used for A/B testing (future enhancement)