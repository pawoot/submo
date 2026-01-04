-- Step 4: Add payment_method_id column to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE RESTRICT;

COMMENT ON COLUMN subscriptions.payment_method_id IS 'Foreign key to payment_methods table (replaces text-based payment_method)';