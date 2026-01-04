-- Add usage_count column to subscriptions table (for templates)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Update usage_count based on actual usage (count subscriptions using each template)
UPDATE subscriptions AS t
SET usage_count = (
  SELECT COUNT(*)
  FROM subscriptions AS s
  WHERE s.name = t.name 
    AND s.is_template = false
    AND t.is_template = true
)
WHERE t.is_template = true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_usage_count ON subscriptions(usage_count DESC) WHERE is_template = true;