-- Step 3: Make category_id NOT NULL after data migration
ALTER TABLE subscriptions 
ALTER COLUMN category_id SET NOT NULL;

-- Optional: Keep old 'category' column for backward compatibility temporarily
-- We can drop it later once everything is tested
-- ALTER TABLE subscriptions DROP COLUMN category;

COMMENT ON COLUMN subscriptions.category IS 'DEPRECATED: Use category_id instead. Kept for backward compatibility.';