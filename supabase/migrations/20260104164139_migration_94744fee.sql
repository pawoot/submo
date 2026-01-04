-- Phase 2.10: Update RLS policies to allow templates (user_id = NULL)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;

-- New policies that support templates
CREATE POLICY "Users can view their subscriptions and templates" ON subscriptions
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_template = true
  );

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND is_template = false
  );

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND is_template = false
  );

CREATE POLICY "Users can delete their own subscriptions" ON subscriptions
  FOR DELETE
  USING (
    auth.uid() = user_id 
    AND is_template = false
  );

-- Admin policy for templates
CREATE POLICY "Admins can manage templates" ON subscriptions
  FOR ALL
  USING (
    is_template = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );