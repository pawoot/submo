-- ============================================================================
-- PHASE 0: Infrastructure Setup - Complete Fix
-- Create missing tables and fix functions
-- ============================================================================

-- 1. Create feature_flags table (if not exists)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_flags
DROP POLICY IF EXISTS "Admins can view feature flags" ON feature_flags;
CREATE POLICY "Admins can view feature flags" ON feature_flags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags" ON feature_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
CREATE POLICY "Admins can insert feature flags" ON feature_flags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Create migration_reports table (if not exists)
CREATE TABLE IF NOT EXISTS migration_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  unmapped_categories INTEGER DEFAULT 0,
  unmapped_payment_methods INTEGER DEFAULT 0,
  invalid_shared_with INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  details JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE migration_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for migration_reports
DROP POLICY IF EXISTS "Admins can view migration reports" ON migration_reports;
CREATE POLICY "Admins can view migration reports" ON migration_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create migration reports" ON migration_reports;
CREATE POLICY "Admins can create migration reports" ON migration_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Create migration_report_rows table (THIS WAS MISSING!)
CREATE TABLE IF NOT EXISTS migration_report_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES migration_reports(id) ON DELETE CASCADE,
  entity TEXT NOT NULL CHECK (entity IN ('subscription', 'category', 'payment_method', 'share', 'reminder')),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('unmapped_category', 'unmapped_payment_method', 'invalid_shared_with', 'invalid_reminder', 'missing_data')),
  record_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('unresolved', 'resolved')) DEFAULT 'unresolved',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_migration_report_rows_status ON migration_report_rows(status);
CREATE INDEX IF NOT EXISTS idx_migration_report_rows_entity ON migration_report_rows(entity);
CREATE INDEX IF NOT EXISTS idx_migration_report_rows_issue_type ON migration_report_rows(issue_type);
CREATE INDEX IF NOT EXISTS idx_migration_report_rows_record_id ON migration_report_rows(record_id);

-- Enable RLS
ALTER TABLE migration_report_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for migration_report_rows
DROP POLICY IF EXISTS "Admins can view report rows" ON migration_report_rows;
CREATE POLICY "Admins can view report rows" ON migration_report_rows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update report rows" ON migration_report_rows;
CREATE POLICY "Admins can update report rows" ON migration_report_rows
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert report rows" ON migration_report_rows;
CREATE POLICY "Admins can insert report rows" ON migration_report_rows
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Insert default feature flags
INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('use_new_dashboard_reads', false, 'Enable reading from subscription_events table'),
  ('use_new_subscription_reads', false, 'Enable reading from new subscription schema'),
  ('use_new_shares_model', false, 'Enable subscription_shares table'),
  ('use_new_reminders_model', false, 'Enable reminder_date column')
ON CONFLICT (key) DO NOTHING;

-- 5. Fix get_migration_health() function - Use correct columns
CREATE OR REPLACE FUNCTION get_migration_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_subs INTEGER;
  mapped_cats INTEGER;
  mapped_pms INTEGER;
  unmapped_cats INTEGER;
  unmapped_pms INTEGER;
  success_rate NUMERIC;
BEGIN
  -- Check admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  -- Get total subscriptions
  SELECT COUNT(*) INTO total_subs FROM subscriptions;

  -- Count mapped categories (using category_id IS NOT NULL)
  SELECT COUNT(*) INTO mapped_cats
  FROM subscriptions
  WHERE category_id IS NOT NULL;

  -- Count mapped payment methods (using payment_method_id IS NOT NULL)
  SELECT COUNT(*) INTO mapped_pms
  FROM subscriptions
  WHERE payment_method_id IS NOT NULL;

  -- Count unmapped
  unmapped_cats := total_subs - mapped_cats;
  unmapped_pms := total_subs - mapped_pms;

  -- Calculate success rate
  IF total_subs > 0 THEN
    success_rate := ROUND(
      ((mapped_cats::NUMERIC + mapped_pms::NUMERIC) / (total_subs::NUMERIC * 2)) * 100,
      2
    );
  ELSE
    success_rate := 100;
  END IF;

  -- Build result
  result := jsonb_build_object(
    'total_subscriptions', total_subs,
    'unmapped_categories', unmapped_cats,
    'unmapped_payment_methods', unmapped_pms,
    'success_rate', success_rate,
    'status', CASE
      WHEN unmapped_cats = 0 AND unmapped_pms = 0 THEN 'healthy'
      WHEN unmapped_cats < 10 AND unmapped_pms < 10 THEN 'needs_attention'
      ELSE 'critical'
    END
  );

  RETURN result;
END;
$$;