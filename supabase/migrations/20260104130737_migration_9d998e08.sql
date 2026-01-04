-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set a default admin user (update this email to your actual admin email)
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (
  SELECT id FROM profiles WHERE email = 'admin@submo.ai' LIMIT 1
);

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;