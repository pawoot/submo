-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notification settings
  email_enabled BOOLEAN DEFAULT true,
  email_7_days_before BOOLEAN DEFAULT true,
  email_3_days_before BOOLEAN DEFAULT true,
  email_1_day_before BOOLEAN DEFAULT true,
  email_on_due_date BOOLEAN DEFAULT true,
  email_monthly_summary BOOLEAN DEFAULT true,
  email_price_changes BOOLEAN DEFAULT true,
  
  -- Push notification settings
  push_enabled BOOLEAN DEFAULT false,
  push_7_days_before BOOLEAN DEFAULT true,
  push_3_days_before BOOLEAN DEFAULT true,
  push_1_day_before BOOLEAN DEFAULT true,
  push_on_due_date BOOLEAN DEFAULT true,
  
  -- Notification preferences
  notification_time TIME DEFAULT '09:00:00',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'UTC',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notification settings" 
  ON notification_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" 
  ON notification_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" 
  ON notification_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create notifications history table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'billing_reminder', 'due_date', 'price_change', 'monthly_summary'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'push', 'in_app'
  
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- Update updated_at trigger for notification_settings
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();