-- ============================================================================
-- Phase 5.1: Data Validation Queries
-- ============================================================================
-- Purpose: Verify data migration success and identify issues
-- Run these queries BEFORE enforcing constraints
-- ============================================================================

-- ============================================================================
-- 1. CATEGORY MAPPING VALIDATION
-- ============================================================================

-- Check unmapped categories (should be 0 after backfill)
SELECT 
  COUNT(*) as unmapped_count,
  COUNT(*) FILTER (WHERE is_template = false) as unmapped_non_template_count
FROM subscriptions
WHERE category IS NOT NULL
AND category_id IS NULL;

-- Sample unmapped categories
SELECT 
  id, name, category, category_legacy,
  created_at
FROM subscriptions
WHERE category IS NOT NULL
AND category_id IS NULL
AND is_template = false
ORDER BY created_at DESC
LIMIT 20;

-- Category mapping success rate
SELECT 
  COUNT(*) FILTER (WHERE category_id IS NOT NULL) as mapped,
  COUNT(*) FILTER (WHERE category_id IS NULL) as unmapped,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE category_id IS NOT NULL) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent
FROM subscriptions
WHERE category IS NOT NULL
AND is_template = false;

-- ============================================================================
-- 2. PAYMENT METHOD MAPPING VALIDATION
-- ============================================================================

-- Check unmapped payment methods
SELECT 
  COUNT(*) as unmapped_count,
  COUNT(*) FILTER (WHERE is_template = false) as unmapped_non_template_count
FROM subscriptions
WHERE payment_method IS NOT NULL
AND payment_method_id IS NULL;

-- Unique unmapped payment method values
SELECT 
  payment_method,
  COUNT(*) as count
FROM subscriptions
WHERE payment_method IS NOT NULL
AND payment_method_id IS NULL
AND is_template = false
GROUP BY payment_method
ORDER BY count DESC
LIMIT 20;

-- Payment method mapping success rate
SELECT 
  COUNT(*) FILTER (WHERE payment_method_id IS NOT NULL) as mapped,
  COUNT(*) FILTER (WHERE payment_method_id IS NULL) as unmapped,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE payment_method_id IS NOT NULL) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate_percent
FROM subscriptions
WHERE payment_method IS NOT NULL
AND is_template = false;

-- ============================================================================
-- 3. REMINDER MIGRATION VALIDATION
-- ============================================================================

-- Compare old vs new reminder settings
SELECT 
  reminder_enabled,
  remind_3_days_before,
  remind_7_days_before,
  reminder_days,
  reminder_enabled_v2,
  reminder_days_array,
  COUNT(*) as count
FROM subscriptions
WHERE is_template = false
GROUP BY 1,2,3,4,5,6
ORDER BY count DESC
LIMIT 20;

-- Check reminders enabled but no days array
SELECT COUNT(*) as invalid_reminder_count
FROM subscriptions
WHERE reminder_enabled_v2 = true
AND (reminder_days_array IS NULL OR reminder_days_array = '{}')
AND is_template = false;

-- Sample reminder comparisons
SELECT 
  id, name,
  reminder_enabled, remind_7_days_before, remind_3_days_before, reminder_days,
  reminder_enabled_v2, reminder_days_array
FROM subscriptions
WHERE is_template = false
AND (reminder_enabled = true OR reminder_enabled_v2 = true)
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 4. SHARING MIGRATION VALIDATION
-- ============================================================================

-- Compare old vs new sharing
SELECT 
  (SELECT COUNT(*) FROM subscriptions WHERE shared_with IS NOT NULL AND array_length(shared_with, 1) > 0) as subs_with_legacy_shares,
  (SELECT COUNT(DISTINCT subscription_id) FROM subscription_shares) as subs_with_new_shares,
  (SELECT COUNT(*) FROM subscription_shares) as total_new_shares;

-- Sample sharing comparison
SELECT 
  s.id, s.name, 
  s.shared_with as legacy_shares,
  (SELECT array_agg(shared_with_user_id) FROM subscription_shares WHERE subscription_id = s.id) as new_shares
FROM subscriptions s
WHERE s.shared_with IS NOT NULL
AND array_length(s.shared_with, 1) > 0
LIMIT 10;

-- ============================================================================
-- 5. STATUS MIGRATION VALIDATION
-- ============================================================================

-- Check status vs is_active consistency
SELECT 
  is_active,
  status,
  COUNT(*) as count
FROM subscriptions
WHERE is_template = false
GROUP BY is_active, status
ORDER BY count DESC;

-- Find inconsistencies
SELECT 
  id, name, is_active, status
FROM subscriptions
WHERE is_template = false
AND (
  (is_active = true AND status != 'active') OR
  (is_active = false AND status = 'active')
)
LIMIT 20;

-- ============================================================================
-- 6. USER OWNERSHIP VALIDATION
-- ============================================================================

-- Check non-template subscriptions without user_id
SELECT COUNT(*) as missing_user_id_count
FROM subscriptions
WHERE is_template = false
AND user_id IS NULL;

-- Sample subscriptions missing user_id
SELECT id, name, is_template, template_id, created_at
FROM subscriptions
WHERE is_template = false
AND user_id IS NULL
LIMIT 10;

-- ============================================================================
-- 7. EVENTS CREATION VALIDATION
-- ============================================================================

-- Check if all subscriptions have 'created' event
SELECT 
  (SELECT COUNT(*) FROM subscriptions WHERE is_template = false) as total_subscriptions,
  (SELECT COUNT(DISTINCT subscription_id) FROM subscription_events WHERE event_type = 'created') as subs_with_created_event;

-- Sample subscriptions missing 'created' event
SELECT s.id, s.name, s.created_at
FROM subscriptions s
WHERE s.is_template = false
AND NOT EXISTS (
  SELECT 1 FROM subscription_events 
  WHERE subscription_id = s.id 
  AND event_type = 'created'
)
LIMIT 10;

-- ============================================================================
-- 8. OVERALL DATA INTEGRITY
-- ============================================================================

-- Generate comprehensive validation summary
SELECT jsonb_build_object(
  'total_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE is_template = false),
  'category_mapped_percent', (
    SELECT ROUND(
      100.0 * COUNT(*) FILTER (WHERE category_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2
    )
    FROM subscriptions 
    WHERE category IS NOT NULL AND is_template = false
  ),
  'payment_method_mapped_percent', (
    SELECT ROUND(
      100.0 * COUNT(*) FILTER (WHERE payment_method_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2
    )
    FROM subscriptions 
    WHERE payment_method IS NOT NULL AND is_template = false
  ),
  'reminders_migrated_count', (
    SELECT COUNT(*) FROM subscriptions 
    WHERE reminder_enabled_v2 = true AND is_template = false
  ),
  'shares_migrated_count', (
    SELECT COUNT(*) FROM subscription_shares
  ),
  'events_created_count', (
    SELECT COUNT(*) FROM subscription_events WHERE event_type = 'created'
  ),
  'missing_user_id_count', (
    SELECT COUNT(*) FROM subscriptions 
    WHERE is_template = false AND user_id IS NULL
  )
) as validation_summary;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Run all queries BEFORE Phase 7 (enforcing constraints)
-- 2. Address any validation failures before proceeding
-- 3. Success criteria:
--    - Category/payment method mapping > 95%
--    - No invalid reminder states
--    - Sharing counts match
--    - All non-templates have user_id
-- 4. Save results for documentation