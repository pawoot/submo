-- ============================================================================
-- Phase 1.3: Add New Columns to Subscriptions Table
-- ============================================================================
-- Purpose: Add normalized fields that will eventually replace legacy ones
-- Safety: All columns NULLABLE, non-breaking, coexist with old fields
-- ============================================================================

-- Add new subscription lifecycle columns
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'paused', 'canceled', 'trial'));

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_anchor_date DATE;

-- Add new reminder system (v2)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_enabled_v2 BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS reminder_days_array INTEGER[] DEFAULT ARRAY[7,3,1,0];

-- Add legacy backup columns (for safe migration)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS category_legacy TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method_legacy TEXT;

-- Add normalized amount (for multi-currency support)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount_normalized NUMERIC(10, 2);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS normalized_currency TEXT DEFAULT 'USD';

-- Add metadata for template system
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_frequency TEXT 
  CHECK (usage_frequency IN ('often', 'sometimes', 'rarely', NULL));

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All columns are NULLABLE for backward compatibility
-- 2. Existing data is not modified (backfill in Phase 2)
-- 3. Legacy columns will be populated in Phase 2 before migration
-- 4. New columns can coexist with old ones during dual-write period
-- 5. status defaults to 'active' for new subscriptions
-- 6. reminder_days_array defaults to [7,3,1,0] (7d, 3d, 1d, same day)