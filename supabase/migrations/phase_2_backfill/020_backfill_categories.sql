-- ============================================================================
-- Phase 2.1: Backfill category_id from category text
-- ============================================================================
-- Purpose: Map legacy category text to category_id (FK)
-- Safety: Idempotent, reports unmapped records, creates "Other" fallback
-- ============================================================================

-- Ensure "Other" category exists as fallback
INSERT INTO categories (id, name_th, name_en, slug, icon, created_at)
VALUES (
  gen_random_uuid(),
  'อื่นๆ',
  'Other',
  'other',
  'Folder',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Step 1: Backup original category text to category_legacy
UPDATE subscriptions
SET category_legacy = category
WHERE category IS NOT NULL 
AND category_legacy IS NULL;

-- Step 2: Map by slug (preferred - exact match)
UPDATE subscriptions s
SET category_id = c.id
FROM categories c
WHERE s.category IS NOT NULL
AND s.category_id IS NULL
AND LOWER(TRIM(s.category)) = LOWER(c.slug);

-- Step 3: Map by name_th (fallback - case insensitive)
UPDATE subscriptions s
SET category_id = c.id
FROM categories c
WHERE s.category IS NOT NULL
AND s.category_id IS NULL
AND LOWER(TRIM(s.category)) = LOWER(c.name_th);

-- Step 4: Map by name_en (fallback - case insensitive)
UPDATE subscriptions s
SET category_id = c.id
FROM categories c
WHERE s.category IS NOT NULL
AND s.category_id IS NULL
AND LOWER(TRIM(s.category)) = LOWER(c.name_en);

-- Step 5: Map remaining to "Other" category
UPDATE subscriptions s
SET category_id = c.id
FROM categories c
WHERE s.category IS NOT NULL
AND s.category_id IS NULL
AND c.slug = 'other';

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Check unmapped count (should be 0 after Step 5)
-- SELECT COUNT(*) as unmapped_categories
-- FROM subscriptions
-- WHERE category IS NOT NULL
-- AND category_id IS NULL
-- AND is_template = false;

-- Sample unmapped records (if any)
-- SELECT id, name, category, category_legacy
-- FROM subscriptions
-- WHERE category IS NOT NULL
-- AND category_id IS NULL
-- AND is_template = false
-- LIMIT 10;

-- Success rate
-- SELECT 
--   COUNT(*) FILTER (WHERE category_id IS NOT NULL) as mapped,
--   COUNT(*) FILTER (WHERE category_id IS NULL) as unmapped,
--   ROUND(
--     100.0 * COUNT(*) FILTER (WHERE category_id IS NOT NULL) / NULLIF(COUNT(*), 0),
--     2
--   ) as success_rate_percent
-- FROM subscriptions
-- WHERE category IS NOT NULL
-- AND is_template = false;