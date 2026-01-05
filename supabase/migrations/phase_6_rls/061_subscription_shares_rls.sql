-- ============================================================================
-- Phase 6.2: RLS Policies for subscription_shares
-- ============================================================================
-- Purpose: Secure subscription sharing - owners and recipients only
-- Safety: Prevents unauthorized access to sharing relationships
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Policy: Users can view shares for subscriptions they own
CREATE POLICY "owners_view_shares" ON subscription_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.id = subscription_shares.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- Policy: Users can view shares where they are the recipient
CREATE POLICY "recipients_view_shares" ON subscription_shares
FOR SELECT
USING (shared_with_user_id = auth.uid());

-- Policy: Subscription owners can create shares
CREATE POLICY "owners_create_shares" ON subscription_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.id = subscription_shares.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- Policy: Subscription owners can update shares (change role)
CREATE POLICY "owners_update_shares" ON subscription_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.id = subscription_shares.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- Policy: Subscription owners can delete shares
CREATE POLICY "owners_delete_shares" ON subscription_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.id = subscription_shares.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- Policy: Recipients can remove themselves from shares
CREATE POLICY "recipients_remove_self" ON subscription_shares
FOR DELETE
USING (shared_with_user_id = auth.uid());

-- ============================================================================
-- ADMIN POLICIES
-- ============================================================================

-- Policy: Admins can view all shares
CREATE POLICY "admins_view_all_shares" ON subscription_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Subscriptions shared with me
CREATE OR REPLACE VIEW shared_with_me AS
SELECT 
  ss.*,
  s.name as subscription_name,
  s.amount,
  s.currency,
  s.billing_cycle,
  p.email as owner_email,
  p.full_name as owner_name
FROM subscription_shares ss
JOIN subscriptions s ON ss.subscription_id = s.id
LEFT JOIN profiles p ON s.user_id = p.id
WHERE ss.shared_with_user_id = auth.uid();

-- View: Subscriptions I've shared
CREATE OR REPLACE VIEW shared_by_me AS
SELECT 
  ss.*,
  s.name as subscription_name,
  p.email as shared_with_email,
  p.full_name as shared_with_name
FROM subscription_shares ss
JOIN subscriptions s ON ss.subscription_id = s.id
LEFT JOIN profiles p ON ss.shared_with_user_id = p.id
WHERE s.user_id = auth.uid();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Owners have full control over shares (create/update/delete)
-- 2. Recipients can view and remove themselves
-- 3. Role-based access (viewer/editor/admin) enforced at app level
-- 4. Consider adding notification triggers for share events (future)