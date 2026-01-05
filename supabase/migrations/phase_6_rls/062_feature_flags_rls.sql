-- ============================================================================
-- Phase 6.3: RLS Policies for feature_flags
-- ============================================================================
-- Purpose: Public read, admin-only write for feature flags
-- Safety: Allows app to read flags, prevents unauthorized changes
-- ============================================================================

-- RLS already enabled in phase_0/003_admin_rls.sql
-- This file documents the policies and provides additional views

-- ============================================================================
-- EXISTING POLICIES (from phase_0/003_admin_rls.sql)
-- ============================================================================

-- ✅ feature_flags_public_read: Anyone can read flags
-- ✅ feature_flags_admin_write: Only admins can modify flags

-- ============================================================================
-- HELPER VIEWS FOR MONITORING
-- ============================================================================

-- View: Active feature flags
CREATE OR REPLACE VIEW active_feature_flags AS
SELECT 
  key,
  enabled,
  rollout_percentage,
  description,
  updated_at
FROM feature_flags
WHERE enabled = true
ORDER BY key;

-- View: Feature flag history (requires audit table - future enhancement)
-- CREATE TABLE feature_flag_history (
--   id uuid primary key default uuid_generate_v4(),
--   flag_key text not null,
--   enabled boolean not null,
--   changed_by uuid references profiles(id),
--   changed_at timestamptz default now()
-- );

-- ============================================================================
-- ADMIN DASHBOARD QUERY
-- ============================================================================

-- Get all flags with usage metrics (requires instrumentation in app)
CREATE OR REPLACE VIEW admin_feature_flags AS
SELECT 
  ff.key,
  ff.enabled,
  ff.rollout_percentage,
  ff.description,
  ff.updated_at,
  ff.created_at
FROM feature_flags ff
ORDER BY ff.key;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Feature flags are PUBLIC READ by design (needed for app functionality)
-- 2. Only admins can toggle flags (instant rollback capability)
-- 3. Consider adding audit trail for flag changes (future)
-- 4. Rollout percentage can be used for A/B testing (app-level logic required)