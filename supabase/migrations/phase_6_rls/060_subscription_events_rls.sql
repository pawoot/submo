-- ============================================================================
-- Phase 6.1: RLS Policies for subscription_events
-- ============================================================================
-- Purpose: Secure subscription events - users can only see their own events
-- Safety: Prevents unauthorized access to event history
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES (Own Data)
-- ============================================================================

-- Policy: Users can view their own subscription events
CREATE POLICY "users_view_own_events" ON subscription_events
FOR SELECT
USING (user_id = auth.uid());

-- Policy: System can insert events (via service functions)
-- Note: App code should use SECURITY DEFINER functions to insert events
CREATE POLICY "system_insert_events" ON subscription_events
FOR INSERT
WITH CHECK (true);

-- Policy: Users cannot update or delete events (append-only)
-- Events are immutable for audit trail

-- ============================================================================
-- ADMIN POLICIES
-- ============================================================================

-- Policy: Admins can view all events
CREATE POLICY "admins_view_all_events" ON subscription_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- HELPER VIEW (Optional - for app convenience)
-- ============================================================================

-- View: Recent user events with subscription details
CREATE OR REPLACE VIEW user_subscription_events AS
SELECT 
  se.*,
  s.name as subscription_name,
  s.amount,
  s.currency,
  s.billing_cycle
FROM subscription_events se
JOIN subscriptions s ON se.subscription_id = s.id
WHERE se.user_id = auth.uid()
ORDER BY se.event_date DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Events are append-only (no UPDATE/DELETE policies)
-- 2. Insert uses SECURITY DEFINER functions (see phase_1/010_subscription_events.sql)
-- 3. Admins can view all events for support purposes
-- 4. Consider row-level encryption for sensitive event metadata (future)