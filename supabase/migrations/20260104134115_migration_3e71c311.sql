-- Step 6: Make payment_method_id NOT NULL after migration
ALTER TABLE subscriptions 
ALTER COLUMN payment_method_id SET NOT NULL;

-- Keep old column for backward compatibility
COMMENT ON COLUMN subscriptions.payment_method IS 'DEPRECATED: Use payment_method_id instead. Kept for backward compatibility.';