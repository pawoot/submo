-- ============================================================================
-- Phase 1.2: Subscription Shares Table
-- ============================================================================
-- Purpose: Normalize subscription sharing (replaces shared_with array)
-- Safety: Additive only, coexists with legacy shared_with field
-- ============================================================================

-- Create subscription_shares table
CREATE TABLE IF NOT EXISTS subscription_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ensure one share per user per subscription
  CONSTRAINT unique_subscription_share UNIQUE (subscription_id, shared_with_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_shares_subscription_id 
  ON subscription_shares(subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscription_shares_user_id 
  ON subscription_shares(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_subscription_shares_created_at 
  ON subscription_shares(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to share subscription
CREATE OR REPLACE FUNCTION share_subscription(
  p_subscription_id UUID,
  p_shared_with_user_id UUID,
  p_role TEXT DEFAULT 'viewer'
)
RETURNS UUID AS $$
DECLARE
  v_share_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get subscription owner
  SELECT user_id INTO v_owner_id
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  -- Prevent self-sharing
  IF v_owner_id = p_shared_with_user_id THEN
    RAISE EXCEPTION 'Cannot share subscription with yourself';
  END IF;
  
  -- Insert or update share
  INSERT INTO subscription_shares 
    (subscription_id, shared_with_user_id, role, created_by)
  VALUES 
    (p_subscription_id, p_shared_with_user_id, p_role, auth.uid())
  ON CONFLICT (subscription_id, shared_with_user_id) 
  DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_share_id;
  
  -- Log event
  PERFORM log_subscription_event(
    v_owner_id,
    p_subscription_id,
    'shared',
    NULL,
    NULL,
    jsonb_build_object('shared_with_user_id', p_shared_with_user_id, 'role', p_role)
  );
  
  RETURN v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unshare subscription
CREATE OR REPLACE FUNCTION unshare_subscription(
  p_subscription_id UUID,
  p_shared_with_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Get subscription owner
  SELECT user_id INTO v_owner_id
  FROM subscriptions
  WHERE id = p_subscription_id;
  
  -- Delete share
  DELETE FROM subscription_shares
  WHERE subscription_id = p_subscription_id
  AND shared_with_user_id = p_shared_with_user_id;
  
  IF FOUND THEN
    -- Log event
    PERFORM log_subscription_event(
      v_owner_id,
      p_subscription_id,
      'unshared',
      NULL,
      NULL,
      jsonb_build_object('shared_with_user_id', p_shared_with_user_id)
    );
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared subscriptions for a user
CREATE OR REPLACE FUNCTION get_shared_subscriptions(p_user_id UUID)
RETURNS TABLE(
  subscription_id UUID,
  subscription_name TEXT,
  owner_id UUID,
  owner_email TEXT,
  role TEXT,
  shared_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.subscription_id,
    s.name,
    s.user_id,
    p.email,
    ss.role,
    ss.created_at
  FROM subscription_shares ss
  JOIN subscriptions s ON ss.subscription_id = s.id
  LEFT JOIN profiles p ON s.user_id = p.id
  WHERE ss.shared_with_user_id = p_user_id
  ORDER BY ss.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Share a subscription:
-- SELECT share_subscription('subscription-uuid', 'friend-user-uuid', 'viewer');

-- Unshare a subscription:
-- SELECT unshare_subscription('subscription-uuid', 'friend-user-uuid');

-- Get all subscriptions shared with me:
-- SELECT * FROM get_shared_subscriptions(auth.uid());

-- Get all users a subscription is shared with:
-- SELECT ss.shared_with_user_id, p.email, ss.role
-- FROM subscription_shares ss
-- LEFT JOIN profiles p ON ss.shared_with_user_id = p.id
-- WHERE ss.subscription_id = 'subscription-uuid';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. RLS policies will be added in Phase 6
-- 2. This replaces the legacy shared_with UUID[] field
-- 3. Role-based access: viewer (read-only), editor (can modify), admin (can delete)
-- 4. Sharing creates an event in subscription_events