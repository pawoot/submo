-- Update RLS policies for subscription_templates table to allow admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view active templates" ON subscription_templates;

-- Create new policies
CREATE POLICY "Anyone can view active templates"
ON subscription_templates FOR SELECT
USING (is_active = true OR auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

CREATE POLICY "Admins can insert templates"
ON subscription_templates FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update templates"
ON subscription_templates FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete templates"
ON subscription_templates FOR DELETE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);