-- ============================================================================
-- Phase 8.1: Deprecate Legacy Field Writes
-- ============================================================================
-- Purpose: Stop app from writing to legacy fields
-- Safety: App reads still work, only writes are stopped
-- ============================================================================

-- ⚠️ WARNING: Deploy new app code BEFORE running this phase
-- Ensure app code no longer writes to:
-- - category (text)
-- - payment_method (text)
-- - remind_3_days_before
-- - remind_7_days_before
-- - reminder_days
-- - shared_with

-- ============================================================================
-- 8.1: Add deprecation warnings (optional)
-- ============================================================================

-- Create function to log deprecated field usage
CREATE OR REPLACE FUNCTION log_deprecated_field_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to a deprecation_warnings table (create if needed)
  CREATE TABLE IF NOT EXISTS deprecation_warnings (
    id uuid primary key default uuid_generate_v4(),
    table_name text,
    field_name text,
    user_id uuid,
    occurred_at timestamptz default now()
  );
  
  -- Log which legacy fields were changed
  IF NEW.category IS DISTINCT FROM OLD.category THEN
    INSERT INTO deprecation_warnings (table_name, field_name, user_id)
    VALUES ('subscriptions', 'category', auth.uid());
  END IF;
  
  IF NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    INSERT INTO deprecation_warnings (table_name, field_name, user_id)
    VALUES ('subscriptions', 'payment_method', auth.uid());
  END IF;
  
  -- Add more field checks as needed...
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply warning trigger (monitoring only)
CREATE TRIGGER warn_deprecated_field_usage
AFTER UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION log_deprecated_field_usage();

-- ============================================================================
-- 8.2: Verify no app writes to legacy fields
-- ============================================================================

-- Monitor deprecation warnings for 1 release cycle (1-2 weeks)
CREATE OR REPLACE VIEW deprecated_field_usage_summary AS
SELECT 
  table_name,
  field_name,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(occurred_at) as last_occurrence
FROM deprecation_warnings
WHERE occurred_at > NOW() - INTERVAL '7 days'
GROUP BY table_name, field_name
ORDER BY usage_count DESC;

-- Query to check:
-- SELECT * FROM deprecated_field_usage_summary;

-- ============================================================================
-- 8.3: Prepare for column drop (validation)
-- ============================================================================

-- Ensure feature flags are enabled for all reads
DO $$
DECLARE
  flag_status record;
BEGIN
  FOR flag_status IN 
    SELECT key, enabled 
    FROM feature_flags 
    WHERE key IN (
      'use_new_dashboard_reads',
      'use_new_subscription_reads',
      'use_new_shares_model',
      'use_new_reminders_model'
    )
  LOOP
    IF NOT flag_status.enabled THEN
      RAISE WARNING 'Feature flag % is not enabled. Enable before dropping columns.', flag_status.key;
    END IF;
  END LOOP;
END $$;

-- Ensure no recent writes to legacy fields
DO $$
DECLARE
  recent_usage integer;
BEGIN
  SELECT COUNT(*) INTO recent_usage
  FROM deprecation_warnings
  WHERE occurred_at > NOW() - INTERVAL '7 days';
  
  IF recent_usage > 0 THEN
    RAISE WARNING 'Found % legacy field writes in past 7 days. Investigate before dropping columns.', recent_usage;
  ELSE
    RAISE NOTICE 'No legacy field writes detected in past 7 days. Safe to proceed to Phase 8.2 (drop columns).';
  END IF;
END $$;

-- ============================================================================
-- CHECKLIST BEFORE PHASE 8.2 (DROP COLUMNS)
-- ============================================================================

-- [ ] All feature flags enabled for 100% of users for 2+ weeks
-- [ ] No deprecation warnings in past 7 days
-- [ ] App code verified to not write legacy fields
-- [ ] Backup database before dropping columns
-- [ ] Phase 5 validation queries all pass
-- [ ] Stakeholder sign-off obtained

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This phase only monitors and warns - does not drop columns yet
-- 2. Run for 1-2 releases to ensure no legacy writes
-- 3. If warnings found, investigate and fix app code before Phase 8.2
-- 4. Dropping columns is irreversible - validate thoroughly