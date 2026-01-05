-- ============================================================================
-- Phase 2.3: Backfill reminder settings into v2 fields
-- ============================================================================
-- Purpose: Consolidate 4 conflicting reminder fields into 2 new fields
-- Safety: Idempotent, preserves all original intent
-- ============================================================================

-- Step 1: Set reminder_enabled_v2 based on any legacy reminder being true
UPDATE subscriptions
SET reminder_enabled_v2 = COALESCE(
  reminder_enabled OR 
  remind_3_days_before OR 
  remind_7_days_before,
  false
)
WHERE reminder_enabled_v2 IS NULL OR reminder_enabled_v2 = false;

-- Step 2: Build reminder_days_array based on legacy fields
UPDATE subscriptions
SET reminder_days_array = (
  SELECT ARRAY_AGG(DISTINCT day ORDER BY day DESC)
  FROM (
    SELECT UNNEST(ARRAY[
      CASE WHEN remind_7_days_before THEN 7 ELSE NULL END,
      CASE WHEN remind_3_days_before THEN 3 ELSE NULL END,
      CASE WHEN reminder_days IS NOT NULL AND reminder_days > 0 THEN reminder_days ELSE NULL END
    ]) AS day
  ) days
  WHERE day IS NOT NULL
)
WHERE reminder_enabled_v2 = true
AND (reminder_days_array IS NULL OR reminder_days_array = '{}');

-- Step 3: Set default reminder days if enabled but empty
UPDATE subscriptions
SET reminder_days_array = ARRAY[7, 3, 1, 0]
WHERE reminder_enabled_v2 = true
AND (reminder_days_array IS NULL OR reminder_days_array = '{}');

-- Step 4: Ensure disabled reminders have empty array
UPDATE subscriptions
SET reminder_days_array = ARRAY[]::integer[]
WHERE reminder_enabled_v2 = false
AND reminder_days_array IS NOT NULL;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check reminder migration success
-- SELECT 
--   COUNT(*) FILTER (WHERE reminder_enabled_v2 = true) as enabled_v2_count,
--   COUNT(*) FILTER (WHERE reminder_enabled = true OR remind_7_days_before OR remind_3_days_before) as enabled_legacy_count,
--   COUNT(*) FILTER (WHERE reminder_enabled_v2 = true AND (reminder_days_array IS NULL OR reminder_days_array = '{}')) as missing_days_array
-- FROM subscriptions
-- WHERE is_template = false;

-- Sample reminder comparisons (old vs new)
-- SELECT 
--   id, name,
--   reminder_enabled, remind_7_days_before, remind_3_days_before, reminder_days,
--   reminder_enabled_v2, reminder_days_array
-- FROM subscriptions
-- WHERE is_template = false
-- AND reminder_enabled_v2 = true
-- LIMIT 10;