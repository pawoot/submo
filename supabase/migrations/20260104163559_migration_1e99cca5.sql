-- Phase 1.1: Add new columns to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS popularity_score INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.is_template IS 'true = template (master data), false = user subscription';
COMMENT ON COLUMN subscriptions.template_id IS 'References parent template if subscription was created from template';