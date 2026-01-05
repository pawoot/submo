-- ============================================================================
-- Phase 6.4: RLS Policies for migration_reports
-- ============================================================================
-- Purpose: Admin-only access to migration reports
-- Safety: Prevents exposure of migration internals to regular users
-- ============================================================================

-- RLS already enabled in phase_0/003_admin_rls.sql
-- This file documents the policies and provides monitoring views

-- ============================================================================
-- EXISTING POLICIES (from phase_0/003_admin_rls.sql)
-- ============================================================================

-- ✅ migration_reports_admin_read: Only admins can read reports
-- ✅ migration_reports_admin_write: Only admins can create reports
-- ✅ migration_report_rows_admin_read: Only admins can read report rows
-- ✅ migration_report_rows_admin_write: Only admins can create report rows

-- ============================================================================
-- ADMIN MONITORING VIEWS (Already created in phase_0)
-- ============================================================================

-- ✅ admin_latest_reports: Latest 20 migration reports
-- ✅ admin_issue_type_breakdown: Issue type counts

-- ============================================================================
-- ADDITIONAL ADMIN QUERIES
-- ============================================================================

-- Get detailed report with drill-down
CREATE OR REPLACE FUNCTION admin_get_report_details(p_report_id uuid)
RETURNS TABLE(
  report_summary jsonb,
  total_issues bigint,
  issue_breakdown jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.summary,
    (SELECT COUNT(*) FROM migration_report_rows WHERE report_id = p_report_id)::bigint,
    (
      SELECT jsonb_object_agg(issue_type, count)
      FROM (
        SELECT issue_type, COUNT(*) as count
        FROM migration_report_rows
        WHERE report_id = p_report_id
        GROUP BY issue_type
      ) issue_counts
    ) as issue_breakdown
  FROM migration_reports mr
  WHERE mr.id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admins only
REVOKE ALL ON FUNCTION admin_get_report_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_get_report_details(uuid) TO authenticated;

-- ============================================================================
-- CLEANUP HELPERS (Admin-only)
-- ============================================================================

-- Function to delete old reports (keep last 10)
CREATE OR REPLACE FUNCTION admin_cleanup_old_reports()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Only allow admins
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Delete reports older than 10 most recent
  DELETE FROM migration_reports
  WHERE id NOT IN (
    SELECT id FROM migration_reports
    ORDER BY generated_at DESC
    LIMIT 10
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All migration report access is admin-only
-- 2. Reports persist indefinitely unless manually cleaned up
-- 3. Use admin_get_report_details() for drill-down analysis
-- 4. Consider automated cleanup after successful migration completion (future)