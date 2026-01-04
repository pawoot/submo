-- Phase 2.8: Remove NOT NULL constraint from user_id
ALTER TABLE subscriptions 
ALTER COLUMN user_id DROP NOT NULL;