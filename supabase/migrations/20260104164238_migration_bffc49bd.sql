-- Phase 2.12: Remove NOT NULL constraints from legacy columns
ALTER TABLE subscriptions 
ALTER COLUMN category DROP NOT NULL,
ALTER COLUMN payment_method DROP NOT NULL;