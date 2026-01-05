-- ============================================================================
-- Phase 0.2: Migration Reports Table
-- ============================================================================
-- Purpose: Track migration issues, unmapped records, and success metrics
-- Safety: Admin-only access, detailed drill-down capability
-- ============================================================================

-- Create migration reports summary table
CREATE TABLE IF NOT EXISTS migration_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  migration_name TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  CONSTRAINT valid_summary CHECK (jsonb_typeof(summary) = 'object')
);

-- Create migration report rows (drill-down details)
CREATE TABLE IF NOT EXISTS migration_report_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES migration_reports(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  record_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_migration_reports_generated_at 
  ON migration_reports(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_migration_report_rows_report_id 
  ON migration_report_rows(report_id);

CREATE INDEX IF NOT EXISTS idx_migration_report_rows_entity_issue 
  ON migration_report_rows(entity, issue_type);

CREATE INDEX IF NOT EXISTS idx_migration_report_rows_record_id 
  ON migration_report_rows(record_id) 
  WHERE record_id IS NOT NULL;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create a new report
CREATE OR REPLACE FUNCTION create_migration_report(
  p_migration_name TEXT,
  p_summary JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
BEGIN
  INSERT INTO migration_reports (migration_name, summary, created_by)
  VALUES (p_migration_name, p_summary, auth.uid())
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add report row
CREATE OR REPLACE FUNCTION add_report_row(
  p_report_id UUID,
  p_entity TEXT,
  p_issue_type TEXT,
  p_record_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_row_id UUID;
BEGIN
  INSERT INTO migration_report_rows 
    (report_id, entity, issue_type, record_id, details)
  VALUES 
    (p_report_id, p_entity, p_issue_type, p_record_id, p_details)
  RETURNING id INTO v_row_id;
  
  RETURN v_row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get report summary with counts
CREATE OR REPLACE FUNCTION get_report_summary(p_report_id UUID)
RETURNS TABLE(
  entity TEXT,
  issue_type TEXT,
  count BIGINT,
  sample_record_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mrr.entity,
    mrr.issue_type,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(mrr.record_id ORDER BY mrr.created_at LIMIT 5) as sample_record_ids
  FROM migration_report_rows mrr
  WHERE mrr.report_id = p_report_id
  GROUP BY mrr.entity, mrr.issue_type
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Create a new report:
-- SELECT create_migration_report('phase_2_backfill', '{"status": "started"}'::jsonb);

-- Add report rows:
-- SELECT add_report_row(
--   'report-uuid-here',
--   'subscriptions',
--   'unmapped_category',
--   'subscription-uuid-here',
--   '{"attempted_value": "Unknown Category", "attempted_matches": ["other", "misc"]}'::jsonb
-- );

-- Get report summary:
-- SELECT * FROM get_report_summary('report-uuid-here');

-- Get detailed drill-down:
-- SELECT * FROM migration_report_rows 
-- WHERE report_id = 'report-uuid-here' 
-- AND issue_type = 'unmapped_category';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies will be added in Phase 6 (admin-only access)
-- 2. Reports are never deleted automatically (audit trail)
-- 3. Use ON DELETE CASCADE to clean up rows when report is deleted
-- 4. summary JSONB can contain any custom metrics per migration