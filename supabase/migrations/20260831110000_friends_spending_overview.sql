-- Friends & Spending Overview: privacy-first social graph.
-- Friend data is available only through the RPCs below; subscriptions remain private.

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requester_visibility TEXT NOT NULL DEFAULT 'summary' CHECK (requester_visibility IN ('none', 'summary')),
  recipient_visibility TEXT NOT NULL DEFAULT 'summary' CHECK (recipient_visibility IN ('none', 'summary')),
  blocked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_unique_pair
  ON public.friendships (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON public.friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS friendships_recipient_idx ON public.friendships(recipient_id, status);

CREATE OR REPLACE FUNCTION public.touch_friendships_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS friendships_updated_at ON public.friendships;
CREATE TRIGGER friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.touch_friendships_updated_at();

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_can_view_own_relationships" ON public.friendships
FOR SELECT USING (auth.uid() IN (requester_id, recipient_id));

-- All mutations go through security-definer functions so the actor and paired
-- relationship are verified in one place.

CREATE OR REPLACE FUNCTION public.request_friend_by_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_recipient UUID;
  v_existing public.friendships;
  v_sender_name TEXT;
BEGIN
  SELECT id INTO v_recipient FROM profiles WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  -- Return the same result for a missing account to avoid account enumeration.
  IF v_recipient IS NULL OR v_recipient = auth.uid() THEN RETURN TRUE; END IF;

  SELECT * INTO v_existing FROM friendships
  WHERE LEAST(requester_id, recipient_id) = LEAST(auth.uid(), v_recipient)
    AND GREATEST(requester_id, recipient_id) = GREATEST(auth.uid(), v_recipient)
  LIMIT 1;

  IF FOUND THEN
    IF v_existing.status = 'blocked' THEN RETURN TRUE; END IF;
    IF v_existing.status IN ('pending', 'accepted') THEN RETURN TRUE; END IF;
    DELETE FROM friendships WHERE id = v_existing.id;
  END IF;

  INSERT INTO friendships (requester_id, recipient_id) VALUES (auth.uid(), v_recipient);
  SELECT COALESCE(full_name, email, 'เพื่อนคนหนึ่ง') INTO v_sender_name FROM profiles WHERE id = auth.uid();
  INSERT INTO notifications (user_id, type, channel, title, message, metadata)
  VALUES (v_recipient, 'friend_invite', 'in_app', 'คำเชิญเป็นเพื่อน', v_sender_name || ' ส่งคำเชิญเป็นเพื่อนถึงคุณ', jsonb_build_object('kind', 'friend_invite'));
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_friend_request(p_friendship_id UUID, p_accept BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_friendship public.friendships;
  v_name TEXT;
BEGIN
  SELECT * INTO v_friendship FROM friendships WHERE id = p_friendship_id FOR UPDATE;
  IF NOT FOUND OR v_friendship.recipient_id <> auth.uid() OR v_friendship.status <> 'pending' THEN RETURN FALSE; END IF;

  UPDATE friendships SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END,
    accepted_at = CASE WHEN p_accept THEN now() ELSE NULL END
  WHERE id = p_friendship_id;

  IF p_accept THEN
    SELECT COALESCE(full_name, email, 'เพื่อนของคุณ') INTO v_name FROM profiles WHERE id = auth.uid();
    INSERT INTO notifications (user_id, type, channel, title, message, metadata)
    VALUES (v_friendship.requester_id, 'friend_accepted', 'in_app', 'ยอมรับคำเชิญแล้ว', v_name || ' ยอมรับคำเชิญเป็นเพื่อนของคุณแล้ว', jsonb_build_object('kind', 'friend_accepted'));
  END IF;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_friend_visibility(p_friendship_id UUID, p_visibility TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_visibility NOT IN ('none', 'summary') THEN RAISE EXCEPTION 'Invalid visibility'; END IF;
  UPDATE friendships SET
    requester_visibility = CASE WHEN requester_id = auth.uid() THEN p_visibility ELSE requester_visibility END,
    recipient_visibility = CASE WHEN recipient_id = auth.uid() THEN p_visibility ELSE recipient_visibility END
  WHERE id = p_friendship_id AND status = 'accepted' AND auth.uid() IN (requester_id, recipient_id);
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_or_block_friend(p_friendship_id UUID, p_block BOOLEAN DEFAULT FALSE)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_block THEN
    UPDATE friendships SET status = 'blocked', blocked_by = auth.uid()
    WHERE id = p_friendship_id AND auth.uid() IN (requester_id, recipient_id);
  ELSE
    DELETE FROM friendships WHERE id = p_friendship_id AND auth.uid() IN (requester_id, recipient_id);
  END IF;
  RETURN FOUND;
END;
$$;

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
    SELECT r.id,
      COUNT(*) FILTER (WHERE s.user_id IS NOT NULL)::INTEGER AS subscriptions,
      COALESCE(jsonb_object_agg(s.currency, s.monthly_total) FILTER (WHERE s.currency IS NOT NULL), '{}'::jsonb) AS monthly,
      COALESCE(jsonb_object_agg(s.currency, s.yearly_total) FILTER (WHERE s.currency IS NOT NULL), '{}'::jsonb) AS yearly
    FROM relationships r
    LEFT JOIN (
      SELECT user_id, currency,
        SUM(amount / CASE billing_cycle WHEN 'yearly' THEN 12 WHEN '3months' THEN 3 WHEN '6months' THEN 6 ELSE 1 END) AS monthly_total,
        SUM(amount * CASE billing_cycle WHEN 'monthly' THEN 12 WHEN '3months' THEN 4 WHEN '6months' THEN 2 ELSE 1 END) AS yearly_total
      FROM subscriptions WHERE is_template = false AND is_active = true GROUP BY user_id, currency
    ) s ON s.user_id = r.peer_id
    GROUP BY r.id
  ), category_rows AS (
    SELECT s.user_id, COALESCE(c.name_en, 'Other') AS category_name, s.currency,
      SUM(s.amount / CASE s.billing_cycle WHEN 'yearly' THEN 12 WHEN '3months' THEN 3 WHEN '6months' THEN 6 ELSE 1 END) AS amount
    FROM subscriptions s LEFT JOIN categories c ON c.id = s.category_id
    WHERE s.is_template = false AND s.is_active = true
    GROUP BY s.user_id, COALESCE(c.name_en, 'Other'), s.currency
  ), category_by_currency AS (
    SELECT r.id, c.category_name, jsonb_object_agg(c.currency, c.amount) AS totals
    FROM relationships r LEFT JOIN category_rows c ON c.user_id = r.peer_id
    GROUP BY r.id, c.category_name
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

GRANT EXECUTE ON FUNCTION public.request_friend_by_email(TEXT), public.respond_to_friend_request(UUID, BOOLEAN),
  public.update_friend_visibility(UUID, TEXT), public.remove_or_block_friend(UUID, BOOLEAN), public.get_friend_overviews() TO authenticated;
