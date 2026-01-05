-- ============================================================================
-- Phase 1.1: Subscription Events Table
-- ============================================================================
-- Purpose: Track all subscription lifecycle events for history and insights
-- Safety: Additive only, no impact on existing data
-- ============================================================================

-- Create subscription_events table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created',
    'updated',
    'canceled',
    'paused',
    'resumed',
    'renewed',
    'price_changed',
    'payment_method_changed',
    'reminder_sent',
    'shared',
    'unshared'
  )),
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount NUMERIC(10, 2),
  currency TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id 
  ON subscription_events(subscription_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id 
  ON subscription_events(user_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_type 
  ON subscription_events(event_type, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_date 
  ON subscription_events(event_date DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to log subscription event
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_user_id UUID,
  p_subscription_id UUID,
  p_event_type TEXT,
  p_amount NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO subscription_events 
    (user_id, subscription_id, event_type, amount, currency, metadata)
  VALUES 
    (p_user_id, p_subscription_id, p_event_type, p_amount, p_currency, p_metadata)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Log a subscription creation:
-- SELECT log_subscription_event(
--   'user-uuid',
--   'subscription-uuid',
--   'created',
--   99.99,
--   'THB',
--   '{"source": "web_app", "template_id": "template-uuid"}'::jsonb
-- );

-- Get subscription history:
-- SELECT * FROM subscription_events 
-- WHERE subscription_id = 'subscription-uuid'
-- ORDER BY event_date DESC;

-- Get user's recent activity:
-- SELECT * FROM subscription_events 
-- WHERE user_id = 'user-uuid'
-- ORDER BY event_date DESC
-- LIMIT 20;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies will be added in Phase 6
-- 2. This table is append-only (no updates/deletes after creation)
-- 3. Use metadata JSONB for flexible event context
-- 4. Consider partitioning by event_date if volume grows (future)