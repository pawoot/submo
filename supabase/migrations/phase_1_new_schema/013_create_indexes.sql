-- ============================================================================
-- Phase 1.4: Create Performance Indexes
-- ============================================================================
-- Purpose: Add indexes for common query patterns and performance
-- Safety: Indexes can be created without locking tables (CONCURRENTLY)
-- ============================================================================

-- Subscriptions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status 
  ON subscriptions(user_id, status) 
  WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_next_billing 
  ON subscriptions(user_id, next_billing_date) 
  WHERE user_id IS NOT NULL AND next_billing_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_next_billing 
  ON subscriptions(next_billing_date) 
  WHERE next_billing_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status 
  ON subscriptions(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_category_id 
  ON subscriptions(category_id) 
  WHERE category_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_payment_method_id 
  ON subscriptions(payment_method_id) 
  WHERE payment_method_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_is_template 
  ON subscriptions(is_template) 
  WHERE is_template = true;

-- Notifications indexes (if not exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_sent 
  ON notifications(user_id, is_read, sent_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_sent 
  ON notifications(user_id, sent_at DESC);

-- Categories indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_slug 
  ON categories(slug);

-- Payment methods indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_slug 
  ON payment_methods(slug);

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Query: Get user's active subscriptions with category
-- EXPLAIN ANALYZE
-- SELECT s.*, c.name_th as category_name
-- FROM subscriptions s
-- LEFT JOIN categories c ON s.category_id = c.id
-- WHERE s.user_id = 'user-uuid'
-- AND s.status = 'active';
-- → Uses idx_subscriptions_user_status + idx_categories_slug

-- Query: Get upcoming renewals
-- EXPLAIN ANALYZE
-- SELECT s.*, p.email
-- FROM subscriptions s
-- JOIN profiles p ON s.user_id = p.id
-- WHERE s.next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
-- AND s.status = 'active';
-- → Uses idx_subscriptions_next_billing

-- Query: Get user's notifications
-- EXPLAIN ANALYZE
-- SELECT * FROM notifications
-- WHERE user_id = 'user-uuid'
-- AND is_read = false
-- ORDER BY sent_at DESC
-- LIMIT 20;
-- → Uses idx_notifications_user_read_sent

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. CONCURRENTLY creates indexes without blocking writes
-- 2. Partial indexes (WHERE clauses) save space and improve performance
-- 3. Multi-column indexes ordered by query cardinality (user_id first)
-- 4. Consider running ANALYZE after index creation for accurate statistics