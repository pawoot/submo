-- Phase 1.4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_template ON subscriptions(is_template);
CREATE INDEX IF NOT EXISTS idx_subscriptions_template_id ON subscriptions(template_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_template ON subscriptions(user_id, is_template);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_popularity ON subscriptions(popularity_score DESC) WHERE is_template = true;