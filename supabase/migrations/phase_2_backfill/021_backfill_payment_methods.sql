-- ============================================================================
-- Phase 2.2: Backfill payment_method_id from payment_method text
-- ============================================================================
-- Purpose: Map legacy payment_method text to payment_method_id (FK)
-- Safety: Idempotent, reports unmapped records, allows NULL for unmapped
-- ============================================================================

-- Step 1: Backup original payment_method text to payment_method_legacy
UPDATE subscriptions
SET payment_method_legacy = payment_method
WHERE payment_method IS NOT NULL 
AND payment_method_legacy IS NULL;

-- Step 2: Map by slug (preferred - exact match)
UPDATE subscriptions s
SET payment_method_id = pm.id
FROM payment_methods pm
WHERE s.payment_method IS NOT NULL
AND s.payment_method_id IS NULL
AND LOWER(TRIM(s.payment_method)) = LOWER(pm.slug);

-- Step 3: Map by name_th (fallback - case insensitive)
UPDATE subscriptions s
SET payment_method_id = pm.id
FROM payment_methods pm
WHERE s.payment_method IS NOT NULL
AND s.payment_method_id IS NULL
AND LOWER(TRIM(s.payment_method)) = LOWER(pm.name_th);

-- Step 4: Map by name_en (fallback - case insensitive)
UPDATE subscriptions s
SET payment_method_id = pm.id
FROM payment_methods pm
WHERE s.payment_method IS NOT NULL
AND s.payment_method_id IS NULL
AND LOWER(TRIM(s.payment_method)) = LOWER(pm.name_en);

-- Note: We intentionally leave unmapped records as NULL
-- (no "Other" payment method fallback)

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check unmapped count
-- SELECT COUNT(*) as unmapped_payment_methods
-- FROM subscriptions
-- WHERE payment_method IS NOT NULL
-- AND payment_method_id IS NULL
-- AND is_template = false;

-- Sample unmapped records
-- SELECT id, name, payment_method, payment_method_legacy
-- FROM subscriptions
-- WHERE payment_method IS NOT NULL
-- AND payment_method_id IS NULL
-- AND is_template = false
-- LIMIT 10;

-- Unique unmapped values (for creating new payment methods)
-- SELECT DISTINCT payment_method, COUNT(*) as count
-- FROM subscriptions
-- WHERE payment_method IS NOT NULL
-- AND payment_method_id IS NULL
-- AND is_template = false
-- GROUP BY payment_method
-- ORDER BY count DESC;

-- Success rate
-- SELECT 
--   COUNT(*) FILTER (WHERE payment_method_id IS NOT NULL) as mapped,
--   COUNT(*) FILTER (WHERE payment_method_id IS NULL) as unmapped,
--   ROUND(
--     100.0 * COUNT(*) FILTER (WHERE payment_method_id IS NOT NULL) / NULLIF(COUNT(*), 0),
--     2
--   ) as success_rate_percent
-- FROM subscriptions
-- WHERE payment_method IS NOT NULL
-- AND is_template = false;