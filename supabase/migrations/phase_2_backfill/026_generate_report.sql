-- ============================================================================
-- Phase 2.7: Generate Migration Report
-- ============================================================================
-- Purpose: Create comprehensive report of migration success/issues
-- Safety: Read-only analysis, creates report for review
-- ============================================================================

DO $$
DECLARE
  v_report_id UUID;
  v_total_subs INTEGER;
  v_unmapped_categories INTEGER;
  v_unmapped_payment_methods INTEGER;
  v_invalid_shares INTEGER;
  v_success_rate NUMERIC;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_subs
  FROM subscriptions
  WHERE is_template = false;
  
  SELECT COUNT(*) INTO v_unmapped_categories
  FROM subscriptions
  WHERE is_template = false
  AND category IS NOT NULL
  AND category_id IS NULL;
  
  SELECT COUNT(*) INTO v_unmapped_payment_methods
  FROM subscriptions
  WHERE is_template = false
  AND payment_method IS NOT NULL
  AND payment_method_id IS NULL;
  
  SELECT COUNT(*) INTO v_invalid_shares
  FROM subscriptions s
  WHERE s.shared_with IS NOT NULL
  AND array_length(s.shared_with, 1) > 0
  AND EXISTS (
    SELECT 1
    FROM unnest(s.shared_with) AS shared_user_id
    WHERE shared_user_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
  
  -- Calculate success rate
  v_success_rate := CASE 
    WHEN v_total_subs > 0 THEN
      ROUND(
        100.0 * (v_total_subs - v_unmapped_categories - v_unmapped_payment_methods) / v_total_subs,
        2
      )
    ELSE 100.0
  END;
  
  -- Create report
  INSERT INTO migration_reports (migration_name, summary)
  VALUES (
    'phase_2_backfill',
    jsonb_build_object(
      'total_subscriptions', v_total_subs,
      'unmapped_category_count', v_unmapped_categories,
      'unmapped_payment_method_count', v_unmapped_payment_methods,
      'invalid_shared_with_count', v_invalid_shares,
      'mapped_success_rate_percent', v_success_rate,
      'notes', CASE
        WHEN v_unmapped_categories > 0 OR v_unmapped_payment_methods > 0 THEN
          'Some records could not be mapped. Review migration_report_rows for details.'
        ELSE
          'All records mapped successfully!'
      END
    )
  )
  RETURNING id INTO v_report_id;
  
  -- Add detail rows for unmapped categories
  INSERT INTO migration_report_rows (report_id, entity, issue_type, record_id, details)
  SELECT 
    v_report_id,
    'subscriptions',
    'unmapped_category',
    s.id,
    jsonb_build_object(
      'name', s.name,
      'category_text', s.category,
      'category_legacy', s.category_legacy
    )
  FROM subscriptions s
  WHERE s.is_template = false
  AND s.category IS NOT NULL
  AND s.category_id IS NULL;
  
  -- Add detail rows for unmapped payment methods
  INSERT INTO migration_report_rows (report_id, entity, issue_type, record_id, details)
  SELECT 
    v_report_id,
    'subscriptions',
    'unmapped_payment_method',
    s.id,
    jsonb_build_object(
      'name', s.name,
      'payment_method_text', s.payment_method,
      'payment_method_legacy', s.payment_method_legacy
    )
  FROM subscriptions s
  WHERE s.is_template = false
  AND s.payment_method IS NOT NULL
  AND s.payment_method_id IS NULL;
  
  RAISE NOTICE 'Migration report created: %', v_report_id;
  RAISE NOTICE 'Total subscriptions: %', v_total_subs;
  RAISE NOTICE 'Unmapped categories: %', v_unmapped_categories;
  RAISE NOTICE 'Unmapped payment methods: %', v_unmapped_payment_methods;
  RAISE NOTICE 'Success rate: %%%', v_success_rate;
END $$;

-- ============================================================================
-- VIEW REPORT
-- ============================================================================

-- View latest report summary
-- SELECT 
--   id,
--   migration_name,
--   generated_at,
--   summary
-- FROM migration_reports
-- ORDER BY generated_at DESC
-- LIMIT 1;

-- View report details
-- SELECT * FROM get_report_summary(
--   (SELECT id FROM migration_reports ORDER BY generated_at DESC LIMIT 1)
-- );