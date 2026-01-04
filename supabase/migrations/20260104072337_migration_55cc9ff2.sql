-- Add preferred_currency column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD';

-- Add comment for documentation
COMMENT ON COLUMN profiles.preferred_currency IS 'User preferred currency for display (USD, THB, EUR, GBP, JPY, etc.)';