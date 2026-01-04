-- Add missing columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS card_last_4 TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE;