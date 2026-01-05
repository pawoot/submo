-- ============================================================================
-- FIX: Backfill Functions Using Text Matching (No subscription_templates)
-- ============================================================================

-- Drop existing broken functions
DROP FUNCTION IF EXISTS rerun_category_backfill();
DROP FUNCTION IF EXISTS rerun_payment_method_backfill();

-- ============================================================================
-- FUNCTION 1: rerun_category_backfill()
-- Strategy: Match subscription names to category names (case-insensitive)
-- ============================================================================

CREATE OR REPLACE FUNCTION rerun_category_backfill()
RETURNS TABLE(
  total_attempted integer,
  successfully_mapped integer,
  still_unmapped integer
) AS $$
DECLARE
  v_admin_id uuid;
  v_attempted integer := 0;
  v_mapped integer := 0;
  v_unmapped integer := 0;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  
  -- Update subscriptions with NULL category_id by matching names
  WITH matched_categories AS (
    SELECT DISTINCT ON (s.id)
      s.id as subscription_id,
      c.id as category_id
    FROM subscriptions s
    CROSS JOIN categories c
    WHERE s.category_id IS NULL
      AND s.is_template = false
      AND (
        -- Exact match (case-insensitive)
        LOWER(s.name) = LOWER(c.name_en) OR
        LOWER(s.name) = LOWER(c.name_th) OR
        -- Partial match (subscription name contains category name)
        LOWER(s.name) LIKE '%' || LOWER(c.name_en) || '%' OR
        LOWER(s.name) LIKE '%' || LOWER(c.name_th) || '%'
      )
    ORDER BY s.id, 
      -- Prioritize exact matches
      CASE 
        WHEN LOWER(s.name) = LOWER(c.name_en) THEN 1
        WHEN LOWER(s.name) = LOWER(c.name_th) THEN 1
        ELSE 2
      END
  ),
  updated AS (
    UPDATE subscriptions s
    SET 
      category_id = mc.category_id,
      updated_at = NOW()
    FROM matched_categories mc
    WHERE s.id = mc.subscription_id
    RETURNING s.id
  )
  SELECT COUNT(*) INTO v_mapped FROM updated;
  
  -- Count total attempted and still unmapped
  SELECT COUNT(*) INTO v_attempted
  FROM subscriptions
  WHERE is_template = false;
  
  SELECT COUNT(*) INTO v_unmapped
  FROM subscriptions
  WHERE category_id IS NULL
    AND is_template = false;
  
  -- Log the action
  INSERT INTO admin_actions_log (
    admin_user_id,
    action_type,
    target_entity,
    affected_count,
    metadata
  ) VALUES (
    v_admin_id,
    'backfill',
    'subscriptions',
    v_mapped,
    jsonb_build_object(
      'type', 'category_backfill',
      'successfully_mapped', v_mapped,
      'still_unmapped', v_unmapped
    )
  );
  
  RETURN QUERY SELECT v_attempted, v_mapped, v_unmapped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION 2: rerun_payment_method_backfill()
-- Strategy: Match subscription names to payment method names (case-insensitive)
-- ============================================================================

CREATE OR REPLACE FUNCTION rerun_payment_method_backfill()
RETURNS TABLE(
  total_attempted integer,
  successfully_mapped integer,
  still_unmapped integer
) AS $$
DECLARE
  v_admin_id uuid;
  v_attempted integer := 0;
  v_mapped integer := 0;
  v_unmapped integer := 0;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  
  -- Update subscriptions with NULL payment_method_id by matching names
  WITH matched_payment_methods AS (
    SELECT DISTINCT ON (s.id)
      s.id as subscription_id,
      pm.id as payment_method_id
    FROM subscriptions s
    CROSS JOIN payment_methods pm
    WHERE s.payment_method_id IS NULL
      AND s.is_template = false
      AND pm.is_active = true
      AND (
        -- Match against payment_method column (legacy field)
        LOWER(s.payment_method) = LOWER(pm.name_en) OR
        LOWER(s.payment_method) = LOWER(pm.name_th) OR
        LOWER(s.payment_method) LIKE '%' || LOWER(pm.name_en) || '%' OR
        LOWER(s.payment_method) LIKE '%' || LOWER(pm.name_th) || '%'
      )
    ORDER BY s.id,
      -- Prioritize exact matches
      CASE 
        WHEN LOWER(s.payment_method) = LOWER(pm.name_en) THEN 1
        WHEN LOWER(s.payment_method) = LOWER(pm.name_th) THEN 1
        ELSE 2
      END
  ),
  updated AS (
    UPDATE subscriptions s
    SET 
      payment_method_id = mpm.payment_method_id,
      updated_at = NOW()
    FROM matched_payment_methods mpm
    WHERE s.id = mpm.subscription_id
    RETURNING s.id
  )
  SELECT COUNT(*) INTO v_mapped FROM updated;
  
  -- Count total attempted and still unmapped
  SELECT COUNT(*) INTO v_attempted
  FROM subscriptions
  WHERE is_template = false;
  
  SELECT COUNT(*) INTO v_unmapped
  FROM subscriptions
  WHERE payment_method_id IS NULL
    AND is_template = false;
  
  -- Log the action
  INSERT INTO admin_actions_log (
    admin_user_id,
    action_type,
    target_entity,
    affected_count,
    metadata
  ) VALUES (
    v_admin_id,
    'backfill',
    'subscriptions',
    v_mapped,
    jsonb_build_object(
      'type', 'payment_method_backfill',
      'successfully_mapped', v_mapped,
      'still_unmapped', v_unmapped
    )
  );
  
  RETURN QUERY SELECT v_attempted, v_mapped, v_unmapped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION rerun_category_backfill() TO authenticated;
GRANT EXECUTE ON FUNCTION rerun_payment_method_backfill() TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Backfill functions created successfully';
  RAISE NOTICE '📊 Functions will use text matching to map categories and payment methods';
  RAISE NOTICE '🔧 Categories: Match by subscription name → category names';
  RAISE NOTICE '🔧 Payment Methods: Match by legacy payment_method field → payment method names';
END $$;