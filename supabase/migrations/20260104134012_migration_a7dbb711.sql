-- Step 1: Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE payment_methods IS 'Payment methods available for subscriptions';
COMMENT ON COLUMN payment_methods.name_en IS 'Payment method name in English';
COMMENT ON COLUMN payment_methods.name_th IS 'Payment method name in Thai';
COMMENT ON COLUMN payment_methods.slug IS 'URL-friendly identifier (e.g., "credit-card")';
COMMENT ON COLUMN payment_methods.icon IS 'Emoji or icon representation';
COMMENT ON COLUMN payment_methods.color IS 'Hex color code for charts';
COMMENT ON COLUMN payment_methods.is_active IS 'Whether this payment method is available for selection';
COMMENT ON COLUMN payment_methods.display_order IS 'Order for displaying in dropdowns';