-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', '3months', '6months', 'yearly')),
  category TEXT NOT NULL,
  payment_method TEXT,
  next_billing_date DATE NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  shared_with TEXT[], -- Array of user IDs or emails
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" 
  ON subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" 
  ON subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" 
  ON subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" 
  ON subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_billing_date ON subscriptions(next_billing_date);
CREATE INDEX idx_subscriptions_category ON subscriptions(category);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();