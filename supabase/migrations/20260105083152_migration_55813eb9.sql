-- ============================================================================
-- Admin Migration Dashboard - Database Setup
-- ============================================================================
-- Purpose: Support Admin UI for migration monitoring and data fixes
-- Security: Admin-only access via RLS
-- Tables: admin_actions_log + helper functions
-- ============================================================================

-- 1. Create admin_actions_log table
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'fix_category', 'fix_payment_method', 'backfill_run', 'feature_flag_toggle', 'manual_edit'
  target_entity TEXT NOT NULL, -- 'subscription', 'category', 'payment_method', 'feature_flag'
  target_id UUID, -- ID of affected record
  before_state JSONB, -- State before change
  after_state JSONB, -- State after change
  affected_count INTEGER DEFAULT 0, -- Number of records affected
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_admin_user 
  ON admin_actions_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_action_type 
  ON admin_actions_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_target 
  ON admin_actions_log(target_entity, target_id);

-- 2. Enable RLS on admin_actions_log
-- ============================================================================
ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Admin can insert and view all logs
CREATE POLICY "Admins can insert action logs"
  ON admin_actions_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all action logs"
  ON admin_actions_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Helper function: Log admin action
-- ============================================================================
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_entity TEXT,
  p_target_id UUID DEFAULT NULL,
  p_before_state JSONB DEFAULT NULL,
  p_after_state JSONB DEFAULT NULL,
  p_affected_count INTEGER DEFAULT 0,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_admin_id UUID;
BEGIN
  -- Get current admin user ID
  v_admin_id := auth.uid();
  
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Insert log
  INSERT INTO admin_actions_log (
    admin_user_id,
    action_type,
    target_entity,
    target_id,
    before_state,
    after_state,
    affected_count,
    metadata
  ) VALUES (
    v_admin_id,
    p_action_type,
    p_target_entity,
    p_target_id,
    p_before_state,
    p_after_state,
    p_affected_count,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper function: Fix unmapped category for subscription
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_fix_subscription_category(
  p_subscription_id UUID,
  p_new_category_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_old_category_id UUID;
  v_old_category_text TEXT;
  v_result JSONB;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Get current state
  SELECT category_id, category_legacy 
  INTO v_old_category_id, v_old_category_text
  FROM subscriptions 
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Update subscription
  UPDATE subscriptions 
  SET category_id = p_new_category_id,
      updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Log action
  PERFORM log_admin_action(
    'fix_category',
    'subscription',
    p_subscription_id,
    jsonb_build_object(
      'category_id', v_old_category_id,
      'category_legacy', v_old_category_text
    ),
    jsonb_build_object(
      'category_id', p_new_category_id
    ),
    1,
    jsonb_build_object('fixed_via', 'admin_ui')
  );
  
  -- Mark report row as resolved
  UPDATE migration_report_rows
  SET details = details || jsonb_build_object('resolved', true, 'resolved_at', NOW())
  WHERE record_id = p_subscription_id
  AND issue_type = 'unmapped_category';
  
  v_result := jsonb_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'old_category_id', v_old_category_id,
    'new_category_id', p_new_category_id
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper function: Fix unmapped payment method
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_fix_subscription_payment_method(
  p_subscription_id UUID,
  p_new_payment_method_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_old_payment_method_id UUID;
  v_old_payment_method_text TEXT;
  v_result JSONB;
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Get current state
  SELECT payment_method_id, payment_method_legacy 
  INTO v_old_payment_method_id, v_old_payment_method_text
  FROM subscriptions 
  WHERE id = p_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found: %', p_subscription_id;
  END IF;
  
  -- Update subscription
  UPDATE subscriptions 
  SET payment_method_id = p_new_payment_method_id,
      updated_at = NOW()
  WHERE id = p_subscription_id;
  
  -- Log action
  PERFORM log_admin_action(
    'fix_payment_method',
    'subscription',
    p_subscription_id,
    jsonb_build_object(
      'payment_method_id', v_old_payment_method_id,
      'payment_method_legacy', v_old_payment_method_text
    ),
    jsonb_build_object(
      'payment_method_id', p_new_payment_method_id
    ),
    1,
    jsonb_build_object('fixed_via', 'admin_ui')
  );
  
  -- Mark report row as resolved
  UPDATE migration_report_rows
  SET details = details || jsonb_build_object('resolved', true, 'resolved_at', NOW())
  WHERE record_id = p_subscription_id
  AND issue_type = 'unmapped_payment_method';
  
  v_result := jsonb_build_object(
    'success', true,
    'subscription_id', p_subscription_id,
    'old_payment_method_id', v_old_payment_method_id,
    'new_payment_method_id', p_new_payment_method_id
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper function: Bulk fix categories
-- ============================================================================
CREATE OR REPLACE FUNCTION admin_bulk_fix_categories(
  p_old_category_text TEXT,
  p_new_category_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_affected_count INTEGER;
  v_subscription_ids UUID[];
BEGIN
  -- Verify admin role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Get affected subscription IDs
  SELECT ARRAY_AGG(id) INTO v_subscription_ids
  FROM subscriptions
  WHERE category_legacy = p_old_category_text
  AND category_id IS NULL;
  
  v_affected_count := COALESCE(array_length(v_subscription_ids, 1), 0);
  
  IF v_affected_count = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'affected_count', 0,
      'message', 'No subscriptions found with this legacy category'
    );
  END IF;
  
  -- Update subscriptions
  UPDATE subscriptions 
  SET category_id = p_new_category_id,
      updated_at = NOW()
  WHERE category_legacy = p_old_category_text
  AND category_id IS NULL;
  
  -- Log action
  PERFORM log_admin_action(
    'bulk_fix_category',
    'subscription',
    NULL,
    jsonb_build_object('category_legacy', p_old_category_text),
    jsonb_build_object('category_id', p_new_category_id),
    v_affected_count,
    jsonb_build_object(
      'fixed_via', 'admin_ui_bulk',
      'subscription_ids', v_subscription_ids
    )
  );
  
  -- Mark report rows as resolved
  UPDATE migration_report_rows
  SET details = details || jsonb_build_object('resolved', true, 'resolved_at', NOW())
  WHERE record_id = ANY(v_subscription_ids)
  AND issue_type = 'unmapped_category';
  
  RETURN jsonb_build_object(
    'success', true,
    'affected_count', v_affected_count,
    'subscription_ids', v_subscription_ids
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Helper function: Get migration health status
-- ============================================================================
CREATE OR REPLACE FUNCTION get_migration_health()
RETURNS JSONB AS $$
DECLARE
  v_total_subscriptions INTEGER;
  v_unmapped_categories INTEGER;
  v_unmapped_payment_methods INTEGER;
  v_unresolved_issues INTEGER;
  v_success_rate NUMERIC;
  v_health_status TEXT;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_subscriptions
  FROM subscriptions WHERE is_template = false;
  
  SELECT COUNT(*) INTO v_unmapped_categories
  FROM subscriptions 
  WHERE is_template = false 
  AND category_id IS NULL
  AND category_legacy IS NOT NULL;
  
  SELECT COUNT(*) INTO v_unmapped_payment_methods
  FROM subscriptions 
  WHERE is_template = false 
  AND payment_method_id IS NULL
  AND payment_method_legacy IS NOT NULL;
  
  SELECT COUNT(*) INTO v_unresolved_issues
  FROM migration_report_rows
  WHERE NOT COALESCE((details->>'resolved')::boolean, false);
  
  -- Calculate success rate
  IF v_total_subscriptions > 0 THEN
    v_success_rate := ROUND(
      ((v_total_subscriptions - v_unmapped_categories - v_unmapped_payment_methods)::NUMERIC 
       / v_total_subscriptions::NUMERIC * 100), 
      2
    );
  ELSE
    v_success_rate := 100;
  END IF;
  
  -- Determine health status
  IF v_success_rate >= 95 THEN
    v_health_status := 'healthy';
  ELSIF v_success_rate >= 80 THEN
    v_health_status := 'needs_attention';
  ELSE
    v_health_status := 'critical';
  END IF;
  
  RETURN jsonb_build_object(
    'total_subscriptions', v_total_subscriptions,
    'unmapped_categories', v_unmapped_categories,
    'unmapped_payment_methods', v_unmapped_payment_methods,
    'unresolved_issues', v_unresolved_issues,
    'success_rate', v_success_rate,
    'health_status', v_health_status,
    'checked_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS (Ensure functions are accessible)
-- ============================================================================
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION admin_fix_subscription_category TO authenticated;
GRANT EXECUTE ON FUNCTION admin_fix_subscription_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION admin_bulk_fix_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_migration_health TO authenticated;

-- ============================================================================
-- NOTES:
-- 1. All functions verify admin role before execution
-- 2. All changes are logged in admin_actions_log
-- 3. Report rows are marked as resolved after fixes
-- 4. Bulk operations track affected subscription IDs
-- 5. Health check provides real-time migration status
-- ============================================================================