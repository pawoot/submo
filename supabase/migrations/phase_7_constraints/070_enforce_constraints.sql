-- ============================================================================
-- Phase 7: Enforce Constraints (After Stable Rollout)
-- ============================================================================
-- Purpose: Lock down data integrity after migration success
-- Safety: Only run after Phase 5 validation passes
-- ============================================================================

-- ⚠️ WARNING: Do NOT run this phase until:
-- 1. Feature flags have been enabled for 100% of users for at least 2 weeks
-- 2. All validation queries pass (Phase 5)
-- 3. No errors or rollbacks in past 2 releases
-- 4. Migration report shows <1% unmapped records

-- ============================================================================
-- 7.1: Enforce user_id for non-template subscriptions
-- ============================================================================

-- Step 1: Verify no nulls exist (should be clean after backfill)
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM subscriptions
  WHERE user_id IS NULL
  AND is_template = false;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL: % subscriptions have null user_id', null_count;
  END IF;
END $$;

-- Step 2: Add CHECK constraint for templates
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_template_no_user CHECK (
  (is_template = true AND user_id IS NULL) OR
  (is_template = false AND user_id IS NOT NULL)
);

-- ============================================================================
-- 7.2: Make reminder_enabled_v2 and reminder_days_array required
-- ============================================================================

-- Set defaults for any remaining nulls
UPDATE subscriptions
SET reminder_enabled_v2 = false
WHERE reminder_enabled_v2 IS NULL;

UPDATE subscriptions
SET reminder_days_array = ARRAY[]::integer[]
WHERE reminder_days_array IS NULL;

-- Make columns NOT NULL
ALTER TABLE subscriptions
ALTER COLUMN reminder_enabled_v2 SET NOT NULL;

ALTER TABLE subscriptions
ALTER COLUMN reminder_days_array SET NOT NULL;

-- Add CHECK constraint for reminder days validity
ALTER TABLE subscriptions
ADD CONSTRAINT valid_reminder_days CHECK (
  (reminder_enabled_v2 = false AND reminder_days_array = ARRAY[]::integer[]) OR
  (reminder_enabled_v2 = true AND array_length(reminder_days_array, 1) > 0)
);

-- ============================================================================
-- 7.3: Enforce status enum
-- ============================================================================

-- Create status enum type
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'canceled', 'trial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add CHECK constraint for valid status values (before converting to enum)
ALTER TABLE subscriptions
ADD CONSTRAINT valid_status CHECK (
  status IN ('active', 'paused', 'canceled', 'trial')
);

-- Optional: Convert column to enum type (requires downtime - consider carefully)
-- ALTER TABLE subscriptions
-- ALTER COLUMN status TYPE subscription_status USING status::subscription_status;

-- ============================================================================
-- 7.4: Enforce category_id for non-template subscriptions
-- ============================================================================

-- Verify no unmapped categories exist
DO $$
DECLARE
  unmapped_count integer;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM subscriptions
  WHERE category_id IS NULL
  AND is_template = false
  AND category IS NOT NULL;
  
  IF unmapped_count > 0 THEN
    RAISE WARNING 'Warning: % subscriptions have null category_id (will map to Other)', unmapped_count;
    
    -- Auto-map to "Other" category
    UPDATE subscriptions s
    SET category_id = (SELECT id FROM categories WHERE slug = 'other' LIMIT 1)
    WHERE s.category_id IS NULL
    AND s.is_template = false
    AND s.category IS NOT NULL;
  END IF;
END $$;

-- Add foreign key constraint with ON DELETE SET NULL
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_category_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE SET NULL;

-- ============================================================================
-- 7.5: Add foreign key constraint for payment_method_id
-- ============================================================================

ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_payment_method_id_fkey;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_payment_method_id_fkey
FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
ON DELETE SET NULL;

-- ============================================================================
-- 7.6: Deprecate legacy fields (prevent new writes)
-- ============================================================================

-- Option A: Add triggers to prevent writes
CREATE OR REPLACE FUNCTION prevent_legacy_field_writes()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow backfill and migration scripts (check role)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Prevent normal users from writing legacy fields
  IF NEW.category IS DISTINCT FROM OLD.category THEN
    RAISE EXCEPTION 'Direct writes to category field are deprecated. Use category_id instead.';
  END IF;
  
  IF NEW.payment_method IS DISTINCT FROM OLD.payment_method THEN
    RAISE EXCEPTION 'Direct writes to payment_method field are deprecated. Use payment_method_id instead.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger (optional - can be aggressive)
-- CREATE TRIGGER enforce_no_legacy_writes
-- BEFORE UPDATE ON subscriptions
-- FOR EACH ROW
-- EXECUTE FUNCTION prevent_legacy_field_writes();

-- ============================================================================
-- 7.7: Validate data integrity post-constraint
-- ============================================================================

-- Run validation checks
DO $$
DECLARE
  validation_results jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_subscriptions', (SELECT COUNT(*) FROM subscriptions WHERE is_template = false),
    'null_user_ids', (SELECT COUNT(*) FROM subscriptions WHERE is_template = false AND user_id IS NULL),
    'null_category_ids', (SELECT COUNT(*) FROM subscriptions WHERE is_template = false AND category_id IS NULL),
    'invalid_statuses', (SELECT COUNT(*) FROM subscriptions WHERE status NOT IN ('active', 'paused', 'canceled', 'trial')),
    'invalid_reminders', (
      SELECT COUNT(*) FROM subscriptions 
      WHERE reminder_enabled_v2 = true 
      AND (reminder_days_array IS NULL OR reminder_days_array = ARRAY[]::integer[])
    )
  ) INTO validation_results;
  
  RAISE NOTICE 'Post-constraint validation: %', validation_results;
END $$;

-- ============================================================================
-- ROLLBACK PLAN
-- ============================================================================

-- To rollback constraints:
-- ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_template_no_user;
-- ALTER TABLE subscriptions DROP CONSTRAINT valid_reminder_days;
-- ALTER TABLE subscriptions DROP CONSTRAINT valid_status;
-- ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_category_id_fkey;
-- ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_payment_method_id_fkey;
-- DROP TRIGGER IF EXISTS enforce_no_legacy_writes ON subscriptions;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Run this phase ONLY after complete validation success
-- 2. Constraints ensure data integrity going forward
-- 3. Legacy field writes are deprecated but not blocked (unless trigger enabled)
-- 4. Rollback is possible by dropping constraints
-- 5. Next phase (8) will drop legacy columns entirely