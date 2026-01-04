-- Phase 2.15: Remove NOT NULL constraint from payment_method_id
ALTER TABLE subscriptions 
ALTER COLUMN payment_method_id DROP NOT NULL;