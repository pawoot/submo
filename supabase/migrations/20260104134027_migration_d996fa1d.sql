-- Step 2: Enable RLS on payment_methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment methods
CREATE POLICY "Anyone can view active payment methods" 
ON payment_methods FOR SELECT 
USING (is_active = TRUE);

-- Only admins can manage payment methods
CREATE POLICY "Admins can manage payment methods" 
ON payment_methods FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  )
);