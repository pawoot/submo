-- Add admin role to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- Add check constraint for role values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create index on role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);