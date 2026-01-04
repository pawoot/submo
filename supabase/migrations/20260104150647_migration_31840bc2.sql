-- เพิ่ม Foreign Key Constraint จาก subscriptions.user_id → profiles.id
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_user_id_profiles_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_profiles ON subscriptions(user_id);