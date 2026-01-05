-- ============================================================================
-- Phase 0.3: Admin RLS Policies (Infrastructure)
-- ============================================================================
-- Purpose: Secure feature_flags and migration_reports for admin-only access
-- Safety: Only profiles with role='admin' can manage these tables
-- ============================================================================

-- Enable RLS on infrastructure tables
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_report_rows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FEATURE FLAGS POLICIES
-- ============================================================================

-- Policy: Anyone can read feature flags (needed for app functionality)
CREATE POLICY "feature_flags_public_read" ON feature_flags
FOR SELECT
USING (true);

-- Policy: Only admins can insert/update/delete feature flags
CREATE POLICY "feature_flags_admin_write" ON feature_flags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- MIGRATION REPORTS POLICIES
-- ============================================================================

-- Policy: Only admins can read migration reports
CREATE POLICY "migration_reports_admin_read" ON migration_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can create/update migration reports
CREATE POLICY "migration_reports_admin_write" ON migration_reports
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- MIGRATION REPORT ROWS POLICIES
-- ============================================================================

-- Policy: Only admins can read report rows
CREATE POLICY "migration_report_rows_admin_read" ON migration_report_rows
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can create/update report rows
CREATE POLICY "migration_report_rows_admin_write" ON migration_report_rows
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- ADMIN HELPER VIEWS (Optional - for dashboard)
-- ============================================================================

-- View: Latest migration reports summary
CREATE OR REPLACE VIEW admin_latest_reports AS
SELECT 
  mr.id,
  mr.migration_name,
  mr.generated_at,
  mr.summary,
  p.email as created_by_email,
  (
    SELECT COUNT(*) 
    FROM migration_report_rows mrr 
    WHERE mrr.report_id = mr.id
  ) as total_issues
FROM migration_reports mr
LEFT JOIN profiles p ON mr.created_by = p.id
ORDER BY mr.generated_at DESC
LIMIT 20;

-- View: Issue type breakdown (for charts)
CREATE OR REPLACE VIEW admin_issue_type_breakdown AS
SELECT 
  mrr.entity,
  mrr.issue_type,
  COUNT(*) as count,
  mr.migration_name,
  mr.generated_at
FROM migration_report_rows mrr
JOIN migration_reports mr ON mrr.report_id = mr.id
WHERE mr.generated_at > NOW() - INTERVAL '30 days'
GROUP BY mrr.entity, mrr.issue_type, mr.migration_name, mr.generated_at
ORDER BY count DESC;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Feature flags are PUBLIC READ (needed for app feature flag checks)
-- 2. Migration reports are ADMIN ONLY (sensitive migration data)
-- 3. Admin check uses profiles.role = 'admin' (ensure this column exists)
-- 4. If using JWT custom claims instead, adjust policies accordingly:
--    (auth.jwt() ->> 'role')::text = 'admin'
-- 5. Consider adding audit logging for admin actions (future enhancement)