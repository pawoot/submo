-- Add reminder fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS remind_3_days_before boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS remind_7_days_before boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_frequency text CHECK (usage_frequency IN ('often', 'sometimes', 'rarely'));

-- Add comment
COMMENT ON COLUMN subscriptions.remind_3_days_before IS 'Send reminder 3 days before billing date';
COMMENT ON COLUMN subscriptions.remind_7_days_before IS 'Send reminder 7 days before billing date';
COMMENT ON COLUMN subscriptions.usage_frequency IS 'How often user uses this subscription';