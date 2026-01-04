-- Step 1: Add new category_id column (UUID) to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_category_id ON subscriptions(category_id);

-- Add comment
COMMENT ON COLUMN subscriptions.category_id IS 'Foreign key to categories table (replaces text-based category)';