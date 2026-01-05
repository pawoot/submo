-- ============================================================================
-- Phase 2.6: Create initial subscription events
-- ============================================================================
-- Purpose: Generate 'created' event for all existing subscriptions
-- Safety: Idempotent (checks if event exists before inserting)
-- ============================================================================

-- Insert 'created' event for each subscription (skip if already exists)
INSERT INTO subscription_events (
  user_id,
  subscription_id,
  event_type,
  event_date,
  amount,
  currency,
  metadata
)
SELECT 
  s.user_id,
  s.id,
  'created',
  s.created_at,
  s.amount,
  s.currency,
  jsonb_build_object(
    'billing_cycle', s.billing_cycle,
    'category_id', s.category_id,
    'is_template', s.is_template
  )
FROM subscriptions s
WHERE s.user_id IS NOT NULL -- Only for user subscriptions (not templates)
AND NOT EXISTS (
  SELECT 1 
  FROM subscription_events se 
  WHERE se.subscription_id = s.id 
  AND se.event_type = 'created'
);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check event counts
-- SELECT 
--   COUNT(DISTINCT subscription_id) as subscriptions_with_events,
--   (SELECT COUNT(*) FROM subscriptions WHERE user_id IS NOT NULL) as total_user_subscriptions
-- FROM subscription_events
-- WHERE event_type = 'created';

-- Sample events
-- SELECT 
--   se.subscription_id,
--   s.name,
--   se.event_type,
--   se.event_date,
--   se.amount,
--   se.currency
-- FROM subscription_events se
-- JOIN subscriptions s ON se.subscription_id = s.id
-- WHERE se.event_type = 'created'
-- LIMIT 10;