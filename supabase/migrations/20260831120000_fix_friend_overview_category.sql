-- The legacy subscriptions.category field may no longer exist. Recreate the
-- overview RPC using only the normalized categories table.
CREATE OR REPLACE FUNCTION public.get_friend_overviews()
RETURNS TABLE(
  friendship_id UUID, friend_id UUID, friend_name TEXT, friend_avatar_url TEXT,
  relationship_status TEXT, is_incoming BOOLEAN, my_visibility TEXT,
  can_view_overview BOOLEAN, subscription_count INTEGER,
  monthly_by_currency JSONB, yearly_by_currency JSONB, categories JSONB
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH relationships AS (
    SELECT f.*, CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END AS peer_id,
      f.recipient_id = auth.uid() AND f.status = 'pending' AS incoming,
      CASE WHEN f.requester_id = auth.uid() THEN f.requester_visibility ELSE f.recipient_visibility END AS my_share,
      CASE WHEN f.requester_id = auth.uid() THEN f.recipient_visibility ELSE f.requester_visibility END AS peer_share
    FROM friendships f WHERE auth.uid() IN (f.requester_id, f.recipient_id)
  ), costs AS (
    SELECT r.id, COUNT(*) FILTER (WHERE s.user_id IS NOT NULL)::INTEGER AS subscriptions,
      COALESCE(jsonb_object_agg(s.currency, s.monthly_total) FILTER (WHERE s.currency IS NOT NULL), '{}'::jsonb) AS monthly,
      COALESCE(jsonb_object_agg(s.currency, s.yearly_total) FILTER (WHERE s.currency IS NOT NULL), '{}'::jsonb) AS yearly
    FROM relationships r LEFT JOIN (
      SELECT user_id, currency,
        SUM(amount / CASE billing_cycle WHEN 'yearly' THEN 12 WHEN '3months' THEN 3 WHEN '6months' THEN 6 ELSE 1 END) AS monthly_total,
        SUM(amount * CASE billing_cycle WHEN 'monthly' THEN 12 WHEN '3months' THEN 4 WHEN '6months' THEN 2 ELSE 1 END) AS yearly_total
      FROM subscriptions WHERE is_template = false AND is_active = true GROUP BY user_id, currency
    ) s ON s.user_id = r.peer_id GROUP BY r.id
  ), category_rows AS (
    SELECT s.user_id, COALESCE(c.name_en, 'Other') AS category_name, s.currency,
      SUM(s.amount / CASE s.billing_cycle WHEN 'yearly' THEN 12 WHEN '3months' THEN 3 WHEN '6months' THEN 6 ELSE 1 END) AS amount
    FROM subscriptions s LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.is_template = false AND s.is_active = true
    GROUP BY s.user_id, COALESCE(c.name_en, 'Other'), s.currency
  ), category_by_currency AS (
    SELECT r.id, c.category_name, jsonb_object_agg(c.currency, c.amount) AS totals
    FROM relationships r LEFT JOIN category_rows c ON c.user_id = r.peer_id GROUP BY r.id, c.category_name
  ), category_costs AS (
    SELECT id, COALESCE(jsonb_object_agg(category_name, totals) FILTER (WHERE category_name IS NOT NULL), '{}'::jsonb) AS category_totals
    FROM category_by_currency GROUP BY id
  )
  SELECT r.id, r.peer_id, COALESCE(p.full_name, 'เพื่อน Submo'), p.avatar_url, r.status, r.incoming, r.my_share,
    r.status = 'accepted' AND r.peer_share = 'summary',
    CASE WHEN r.status = 'accepted' AND r.peer_share = 'summary' THEN COALESCE(costs.subscriptions, 0) ELSE 0 END,
    CASE WHEN r.status = 'accepted' AND r.peer_share = 'summary' THEN costs.monthly ELSE '{}'::jsonb END,
    CASE WHEN r.status = 'accepted' AND r.peer_share = 'summary' THEN costs.yearly ELSE '{}'::jsonb END,
    CASE WHEN r.status = 'accepted' AND r.peer_share = 'summary' THEN category_costs.category_totals ELSE '{}'::jsonb END
  FROM relationships r JOIN profiles p ON p.id = r.peer_id
  LEFT JOIN costs ON costs.id = r.id LEFT JOIN category_costs ON category_costs.id = r.id
  WHERE r.status <> 'blocked';
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_overviews() TO authenticated;
