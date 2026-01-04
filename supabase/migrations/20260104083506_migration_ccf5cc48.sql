-- Add first_name and last_name columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.first_name IS 'User first name from OAuth provider';
COMMENT ON COLUMN profiles.last_name IS 'User last name from OAuth provider';