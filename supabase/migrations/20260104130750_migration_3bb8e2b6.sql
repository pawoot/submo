-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view active categories
CREATE POLICY "Anyone can view active categories" 
ON categories FOR SELECT 
USING (is_active = TRUE);

-- Only admins can insert categories
CREATE POLICY "Admins can insert categories" 
ON categories FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- Only admins can update categories
CREATE POLICY "Admins can update categories" 
ON categories FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories" 
ON categories FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = TRUE
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Insert default categories
INSERT INTO categories (name_en, name_th, slug, icon, color, display_order) VALUES
  ('Design', 'ดีไซน์', 'design', '🎨', '#ec4899', 1),
  ('Development', 'พัฒนา', 'development', '💻', '#8b5cf6', 2),
  ('Productivity', 'ผลิตภาพ', 'productivity', '⚡', '#6366f1', 3),
  ('Entertainment', 'บันเทิง', 'entertainment', '🎬', '#ef4444', 4),
  ('Storage', 'จัดเก็บข้อมูล', 'storage', '☁️', '#06b6d4', 5),
  ('Communication', 'สื่อสาร', 'communication', '💬', '#10b981', 6),
  ('Marketing', 'การตลาด', 'marketing', '📊', '#f59e0b', 7),
  ('Education', 'การศึกษา', 'education', '📚', '#3b82f6', 8),
  ('Finance', 'การเงิน', 'finance', '💰', '#14b8a6', 9),
  ('Health', 'สุขภาพ', 'health', '❤️', '#f43f5e', 10),
  ('Other', 'อื่นๆ', 'other', '📦', '#6b7280', 11)
ON CONFLICT (slug) DO NOTHING;