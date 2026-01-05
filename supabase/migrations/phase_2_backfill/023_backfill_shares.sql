-- ============================================================================
-- Phase 2.4: Backfill subscription_shares from shared_with array
-- ============================================================================
-- Purpose: Normalize sharing data from array to relational table
-- Safety: Handles invalid UUIDs, reports issues, idempotent
-- ============================================================================

-- Create a report for this backfill
DO $$
DECLARE
  v_report_id UUID;
BEGIN
  SELECT create_migration_report('phase_2_backfill_shares', '{}'::jsonb) INTO v_report_id;
  
  -- Process each subscription with shared_with data
  INSERT INTO subscription_shares (subscription_id, shared_with_user_id, role, created_by)
  SELECT DISTINCT
    s.id,
    shared_user_id::uuid,
    'viewer' as role,
    s.user_id as created_by
  FROM subscriptions s
  CROSS JOIN LATERAL unnest(s.shared_with) AS shared_user_id
  WHERE s.shared_with IS NOT NULL 
  AND array_length(s.shared_with, 1) > 0
  AND shared_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' -- Valid UUID format
  ON CONFLICT (subscription_id, shared_with_user_id) DO NOTHING;
  
  -- Report invalid shared_with entries
  INSERT INTO migration_report_rows (report_id, entity, issue_type, record_id, details)
  SELECT 
    v_report_id,
    'subscriptions',
    'invalid_shared_with',
    s.id,
    jsonb_build_object(
      'shared_with_value', s.shared_with::text,
      'invalid_entries', (
        SELECT array_agg(shared_user_id)
        FROM unnest(s.shared_with) AS shared_user_id
        WHERE shared_user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )
    )
  FROM subscriptions s
  WHERE s.shared_with IS NOT NULL
  AND array_length(s.shared_with, 1) > 0
  AND EXISTS (
    SELECT 1
    FROM unnest(s.shared_with) AS shared_user_id
    WHERE shared_user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
  
  -- Update report summary
  UPDATE migration_reports
  SET summary = jsonb_build_object(
    'total_subscriptions_with_shares', (
      SELECT COUNT(*) FROM subscriptions 
      WHERE shared_with IS NOT NULL AND array_length(shared_with, 1) > 0
    ),
    'shares_created', (
      SELECT COUNT(*) FROM subscription_shares
    ),
    'invalid_entries_count', (
      SELECT COUNT(*) FROM migration_report_rows 
      WHERE report_id = v_report_id AND issue_type = 'invalid_shared_with'
    )
  )
  WHERE id = v_report_id;
END $$;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Compare counts
-- SELECT 
--   (SELECT COUNT(*) FROM subscriptions WHERE shared_with IS NOT NULL AND array_length(shared_with, 1) > 0) as subs_with_legacy_shares,
--   (SELECT COUNT(DISTINCT subscription_id) FROM subscription_shares) as subs_with_new_shares,
--   (SELECT COUNT(*) FROM subscription_shares) as total_new_shares;

-- Sample comparison
-- SELECT 
--   s.id, s.name, s.shared_with,
--   (SELECT array_agg(shared_with_user_id) FROM subscription_shares WHERE subscription_id = s.id) as new_shares
-- FROM subscriptions s
-- WHERE s.shared_with IS NOT NULL
-- LIMIT 10;