-- Create admin policy for viewing all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);