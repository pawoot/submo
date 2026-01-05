-- Fix: Remove deleted_at condition from backfill functions

-- Drop existing functions
DROP FUNCTION IF EXISTS rerun_category_backfill();
DROP FUNCTION IF EXISTS rerun_payment_method_backfill();

-- Recreate rerun_category_backfill without deleted_at check
CREATE OR REPLACE FUNCTION rerun_category_backfill()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mapped_count INTEGER;
  result JSONB;
BEGIN
  -- Only allow admins
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Map categories from templates
  WITH mapped AS (
    UPDATE subscriptions s
    SET 
      category_id = st.category_id,
      updated_at = NOW()
    FROM subscription_templates st
    WHERE s.category_id IS NULL
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(st.name))
      AND st.category_id IS NOT NULL
    RETURNING s.id
  )
  SELECT COUNT(*) INTO mapped_count FROM mapped;

  -- Log the action
  PERFORM log_admin_action(
    'rerun_category_backfill',
    'migration',
    jsonb_build_object('mapped_count', mapped_count)
  );

  result := jsonb_build_object(
    'success', true,
    'mapped_count', mapped_count,
    'message', format('Successfully mapped %s categories', mapped_count)
  );

  RETURN result;
END;
$$;

-- Recreate rerun_payment_method_backfill without deleted_at check
CREATE OR REPLACE FUNCTION rerun_payment_method_backfill()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mapped_count INTEGER;
  result JSONB;
BEGIN
  -- Only allow admins
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Map payment methods from templates
  WITH mapped AS (
    UPDATE subscriptions s
    SET 
      payment_method_id = st.payment_method_id,
      updated_at = NOW()
    FROM subscription_templates st
    WHERE s.payment_method_id IS NULL
      AND LOWER(TRIM(s.name)) = LOWER(TRIM(st.name))
      AND st.payment_method_id IS NOT NULL
    RETURNING s.id
  )
  SELECT COUNT(*) INTO mapped_count FROM mapped;

  -- Log the action
  PERFORM log_admin_action(
    'rerun_payment_method_backfill',
    'migration',
    jsonb_build_object('mapped_count', mapped_count)
  );

  result := jsonb_build_object(
    'success', true,
    'mapped_count', mapped_count,
    'message', format('Successfully mapped %s payment methods', mapped_count)
  );

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION rerun_category_backfill() TO authenticated;
GRANT EXECUTE ON FUNCTION rerun_payment_method_backfill() TO authenticated;