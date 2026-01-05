-- ============================================================================
-- Phase 8.2: Drop Legacy Columns (FINAL CLEANUP)
-- ============================================================================
-- Purpose: Remove deprecated columns after successful migration
-- Safety: IRREVERSIBLE - Ensure Phase 8.1 validation passes first
-- ============================================================================

-- ⚠️ CRITICAL WARNING: This operation is IRREVERSIBLE
-- ⚠️ BACKUP DATABASE before running this migration
-- ⚠️ Ensure ALL Phase 8.1 checks pass

-- ============================================================================
-- PRE-DROP VALIDATION (Mandatory)
-- ============================================================================

DO $$
DECLARE
  validation_failed boolean := false;
  flag_count integer;
  warning_count integer;
BEGIN
  -- Check 1: All feature flags enabled
  SELECT COUNT(*) INTO flag_count
  FROM feature_flags
  WHERE key IN (
    'use_new_dashboard_reads',
    'use_new_subscription_reads',
    'use_new_shares_model',
    'use_new_reminders_model'
  )
  AND enabled = false;
  
  IF flag_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: % feature flags are still disabled', flag_count;
  END IF;
  
  -- Check 2: No recent legacy field writes
  SELECT COUNT(*) INTO warning_count
  FROM deprecation_warnings
  WHERE occurred_at > NOW() - INTERVAL '14 days';
  
  IF warning_count > 0 THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Found % legacy field writes in past 14 days', warning_count;
  END IF;
  
  -- Check 3: Data migration success rate
  IF EXISTS (
    SELECT 1 FROM subscriptions
    WHERE is_template = false
    AND (
      (category IS NOT NULL AND category_id IS NULL) OR
      (payment_method IS NOT NULL AND payment_method_id IS NULL)
    )
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'VALIDATION FAILED: Unmapped category or payment method records still exist';
  END IF;
  
  RAISE NOTICE 'All pre-drop validations passed. Proceeding with column drops.';
END $$;

-- ============================================================================
-- WAVE A: Drop Reminder Fields (Non-critical)
-- ============================================================================

-- Drop old reminder boolean fields
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS remind_3_days_before CASCADE;

ALTER TABLE subscriptions
DROP COLUMN IF EXISTS remind_7_days_before CASCADE;

ALTER TABLE subscriptions
DROP COLUMN IF EXISTS reminder_days CASCADE;

ALTER TABLE subscriptions
DROP COLUMN IF EXISTS reminder_enabled CASCADE;

-- Keep reminder_enabled_v2 and reminder_days_array (new fields)

RAISE NOTICE 'Wave A complete: Old reminder fields dropped';

-- ============================================================================
-- WAVE B: Drop Category/Payment Method Text Fields
-- ============================================================================

-- Drop text fields (keep legacy backups for now)
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS category CASCADE;

ALTER TABLE subscriptions
DROP COLUMN IF EXISTS payment_method CASCADE;

-- Keep category_legacy and payment_method_legacy for audit (can drop later)

RAISE NOTICE 'Wave B complete: category and payment_method text fields dropped';

-- ============================================================================
-- WAVE C: Drop Sharing Array Field
-- ============================================================================

-- Drop shared_with array (replaced by subscription_shares table)
ALTER TABLE subscriptions
DROP COLUMN IF EXISTS shared_with CASCADE;

RAISE NOTICE 'Wave C complete: shared_with array field dropped';

-- ============================================================================
-- WAVE D: Drop is_active (Optional - only if fully replaced by status)
-- ============================================================================

-- Keep is_active for backward compatibility? Or drop if fully migrated to status
-- Uncomment below to drop:

-- ALTER TABLE subscriptions
-- DROP COLUMN IF EXISTS is_active CASCADE;

-- RAISE NOTICE 'Wave D complete: is_active field dropped';

-- ============================================================================
-- OPTIONAL: Drop Legacy Backup Fields (After Final Audit)
-- ============================================================================

-- These can be dropped after 30 days of stable operation:
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS category_legacy CASCADE;
-- ALTER TABLE subscriptions DROP COLUMN IF EXISTS payment_method_legacy CASCADE;

-- ============================================================================
-- POST-DROP VALIDATION
-- ============================================================================

DO $$
DECLARE
  column_exists boolean;
BEGIN
  -- Verify dropped columns are gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
    AND column_name IN (
      'category',
      'payment_method',
      'remind_3_days_before',
      'remind_7_days_before',
      'reminder_days',
      'reminder_enabled',
      'shared_with'
    )
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE EXCEPTION 'POST-DROP VALIDATION FAILED: Some legacy columns still exist';
  END IF;
  
  RAISE NOTICE 'POST-DROP VALIDATION PASSED: All target columns successfully dropped';
END $$;

-- ============================================================================
-- CLEANUP: Drop Deprecation Monitoring (Optional)
-- ============================================================================

-- After successful drop, clean up monitoring infrastructure
DROP TRIGGER IF EXISTS warn_deprecated_field_usage ON subscriptions;
DROP FUNCTION IF EXISTS log_deprecated_field_usage();
DROP TABLE IF EXISTS deprecation_warnings;

-- ============================================================================
-- FINAL MIGRATION REPORT
-- ============================================================================

-- Generate final migration report
DO $$
DECLARE
  report_id uuid;
  final_summary jsonb;
BEGIN
  -- Create final report
  SELECT create_migration_report('phase_8_final_cleanup') INTO report_id;
  
  -- Build summary
  SELECT jsonb_build_object(
    'migration_completed_at', NOW(),
    'total_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE is_template = false),
    'columns_dropped', ARRAY[
      'category', 'payment_method', 
      'remind_3_days_before', 'remind_7_days_before', 'reminder_days', 'reminder_enabled',
      'shared_with'
    ],
    'new_tables_created', ARRAY['subscription_events', 'subscription_shares'],
    'feature_flags_enabled', (
      SELECT jsonb_object_agg(key, enabled)
      FROM feature_flags
      WHERE key LIKE 'use_new_%'
    ),
    'data_integrity_check', (
      SELECT jsonb_build_object(
        'null_user_ids', COUNT(*) FILTER (WHERE user_id IS NULL AND is_template = false),
        'null_category_ids', COUNT(*) FILTER (WHERE category_id IS NULL AND is_template = false),
        'null_payment_methods', COUNT(*) FILTER (WHERE payment_method_id IS NULL AND is_template = false)
      )
      FROM subscriptions
    )
  ) INTO final_summary;
  
  -- Update report summary
  UPDATE migration_reports
  SET summary = final_summary
  WHERE id = report_id;
  
  RAISE NOTICE 'Final migration report generated: %', report_id;
  RAISE NOTICE 'Migration complete! Summary: %', final_summary;
END $$;

-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================

-- ⚠️ COLUMN DROPS ARE IRREVERSIBLE
-- To rollback, you would need to:
-- 1. Restore from database backup
-- 2. Re-run migrations from Phase 0
-- 3. This is a LAST RESORT only

-- Partial rollback (if caught early):
-- - Re-add columns with ALTER TABLE ADD COLUMN
-- - Re-enable dual writes in app
-- - Backfill from *_legacy fields

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================

-- Migration is considered successful if:
-- ✅ All legacy columns dropped
-- ✅ All feature flags enabled
-- ✅ Zero data loss
-- ✅ App functions normally
-- ✅ Performance improved (validate with Phase 5 queries)
-- ✅ No user complaints for 2 weeks

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. This is the FINAL phase of migration
-- 2. After this, schema is clean and optimized
-- 3. Keep migration report tables for audit trail
-- 4. Consider archiving migration files after 90 days
-- 5. Document lessons learned for future migrations