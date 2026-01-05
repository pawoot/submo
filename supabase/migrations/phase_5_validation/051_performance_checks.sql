-- ============================================================================
-- Phase 5.2: Performance Validation Queries
-- ============================================================================
-- Purpose: Verify query performance improvements and identify bottlenecks
-- Run EXPLAIN ANALYZE to measure actual performance
-- ============================================================================

-- ============================================================================
-- 1. DASHBOARD QUERIES (Most Critical)
-- ============================================================================

-- Old query (legacy fields)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  COUNT(*) as total_count,
  SUM(
    CASE 
      WHEN billing_cycle = 'monthly' THEN amount
      WHEN billing_cycle = 'yearly' THEN amount / 12
      WHEN billing_cycle = 'quarterly' THEN amount / 3
      WHEN billing_cycle = 'half-yearly' THEN amount / 6
      ELSE amount
    END
  ) as total_monthly_cost
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND is_active = true
AND is_template = false;

-- New query (with FK joins)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  COUNT(*) as total_count,
  SUM(
    CASE 
      WHEN s.billing_cycle = 'monthly' THEN s.amount
      WHEN s.billing_cycle = 'yearly' THEN s.amount / 12
      WHEN s.billing_cycle = 'quarterly' THEN s.amount / 3
      WHEN s.billing_cycle = 'half-yearly' THEN s.amount / 6
      ELSE s.amount
    END
  ) as total_monthly_cost
FROM subscriptions s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
WHERE s.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND s.status = 'active'
AND s.is_template = false;

-- Category breakdown (new query)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  c.name_en as category,
  COUNT(*) as count,
  SUM(
    CASE 
      WHEN s.billing_cycle = 'monthly' THEN s.amount
      WHEN s.billing_cycle = 'yearly' THEN s.amount / 12
      WHEN s.billing_cycle = 'quarterly' THEN s.amount / 3
      WHEN s.billing_cycle = 'half-yearly' THEN s.amount / 6
      ELSE s.amount
    END
  ) as monthly_cost
FROM subscriptions s
JOIN categories c ON s.category_id = c.id
WHERE s.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND s.status = 'active'
AND s.is_template = false
GROUP BY c.id, c.name_en
ORDER BY monthly_cost DESC;

-- ============================================================================
-- 2. SUBSCRIPTION LIST QUERIES
-- ============================================================================

-- List with joins (new)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  s.*,
  c.name_en as category_name,
  c.icon as category_icon,
  pm.name_en as payment_method_name,
  pm.icon as payment_method_icon
FROM subscriptions s
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
WHERE s.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND s.is_template = false
ORDER BY s.next_billing_date ASC
LIMIT 50;

-- ============================================================================
-- 3. SHARED SUBSCRIPTIONS QUERIES
-- ============================================================================

-- Old query (array contains)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM subscriptions
WHERE 'YOUR_USER_ID_HERE' = ANY(shared_with) -- Replace with actual user_id
AND is_template = false;

-- New query (subscription_shares join)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  s.*,
  ss.role,
  p.email as owner_email
FROM subscription_shares ss
JOIN subscriptions s ON ss.subscription_id = s.id
LEFT JOIN profiles p ON s.user_id = p.id
WHERE ss.shared_with_user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
ORDER BY ss.created_at DESC;

-- ============================================================================
-- 4. REMINDER QUERIES
-- ============================================================================

-- Old reminder query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND is_active = true
AND (remind_3_days_before = true OR remind_7_days_before = true)
AND next_billing_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';

-- New reminder query (v2)
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT *
FROM subscriptions
WHERE user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND status = 'active'
AND reminder_enabled_v2 = true
AND reminder_days_array IS NOT NULL
AND (
  -- Check if any reminder day matches
  EXTRACT(DAY FROM (next_billing_date - CURRENT_DATE))::integer = ANY(reminder_days_array)
);

-- ============================================================================
-- 5. EVENT HISTORY QUERIES
-- ============================================================================

-- Subscription event history
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  se.*,
  s.name as subscription_name
FROM subscription_events se
JOIN subscriptions s ON se.subscription_id = s.id
WHERE se.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
ORDER BY se.event_date DESC
LIMIT 100;

-- Recent activity
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  se.event_type,
  se.event_date,
  s.name as subscription_name,
  se.amount,
  se.currency
FROM subscription_events se
JOIN subscriptions s ON se.subscription_id = s.id
WHERE se.user_id = 'YOUR_USER_ID_HERE' -- Replace with actual user_id
AND se.event_date > CURRENT_DATE - INTERVAL '30 days'
ORDER BY se.event_date DESC;

-- ============================================================================
-- 6. INDEX USAGE VERIFICATION
-- ============================================================================

-- Check if indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'subscription_events', 'subscription_shares', 'notifications')
ORDER BY idx_scan DESC;

-- Check for unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'subscription_events', 'subscription_shares')
AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 7. TABLE SIZE AND BLOAT
-- ============================================================================

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('subscriptions', 'subscription_events', 'subscription_shares', 'categories', 'payment_methods', 'profiles')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 8. QUERY STATISTICS (PostgreSQL 13+)
-- ============================================================================

-- Top slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%subscriptions%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- ============================================================================
-- PERFORMANCE BENCHMARKS
-- ============================================================================

-- Success criteria:
-- 1. Dashboard queries: < 100ms
-- 2. List queries: < 200ms
-- 3. Detail queries: < 50ms
-- 4. Reminder queries: < 150ms
-- 5. Index scans > 0 for all critical indexes
-- 6. No sequential scans on large tables for filtered queries

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Replace 'YOUR_USER_ID_HERE' with actual user_id for testing
-- 2. Run during low-traffic hours for accurate results
-- 3. Compare old vs new query execution times
-- 4. Look for "Seq Scan" in EXPLAIN output (bad for large tables)
-- 5. Look for "Index Scan" or "Bitmap Index Scan" (good)
-- 6. Run ANALYZE tables; before benchmarking if data changed significantly