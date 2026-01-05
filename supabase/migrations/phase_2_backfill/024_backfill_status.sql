-- ============================================================================
-- Phase 2.5: Backfill status from is_active
-- ============================================================================
-- Purpose: Map legacy is_active boolean to new status field
-- Safety: Idempotent, preserves intent
-- ============================================================================

-- Step 1: Backfill status based on is_active
UPDATE subscriptions
SET status = CASE
  WHEN is_active = true THEN 'active'
  WHEN is_active = false THEN 'canceled'
  ELSE 'active' -- Default to active if null
END
WHERE status IS NULL OR status = '';

-- Step 2: Set default status for templates
UPDATE subscriptions
SET status = 'template'
WHERE is_template = true
AND status != 'template';

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check status distribution
-- SELECT 
--   status,
--   COUNT(*) as count,
--   ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percent
-- FROM subscriptions
-- WHERE is_template = false
-- GROUP BY status
-- ORDER BY count DESC;

-- Compare with is_active
-- SELECT 
--   is_active,
--   status,
--   COUNT(*) as count
-- FROM subscriptions
-- WHERE is_template = false
-- GROUP BY is_active, status
-- ORDER BY is_active, status;