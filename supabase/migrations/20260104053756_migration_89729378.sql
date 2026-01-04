-- Create subscription_templates table
CREATE TABLE IF NOT EXISTS subscription_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  category TEXT NOT NULL,
  default_price DECIMAL(10, 2),
  default_currency TEXT DEFAULT 'USD',
  default_billing_cycle TEXT DEFAULT 'monthly',
  description TEXT,
  website_url TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can view active templates
CREATE POLICY "Anyone can view active templates" 
  ON subscription_templates 
  FOR SELECT 
  USING (is_active = true);

-- Only authenticated users can manage templates (for admin panel)
CREATE POLICY "Authenticated users can manage templates" 
  ON subscription_templates 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_templates_category ON subscription_templates(category);
CREATE INDEX IF NOT EXISTS idx_subscription_templates_popular ON subscription_templates(is_popular);
CREATE INDEX IF NOT EXISTS idx_subscription_templates_active ON subscription_templates(is_active);

-- Insert popular subscription services
INSERT INTO subscription_templates (name, logo_url, category, default_price, default_currency, default_billing_cycle, description, website_url, is_popular, display_order) VALUES
-- Streaming
('Netflix', 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=200&h=200&fit=crop', 'Streaming', 17.99, 'USD', 'monthly', 'Watch TV shows and movies', 'https://netflix.com', true, 1),
('Disney+', 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=200&h=200&fit=crop', 'Streaming', 15.99, 'USD', 'monthly', 'Disney, Pixar, Marvel, Star Wars', 'https://disneyplus.com', true, 2),
('Amazon Prime', 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=200&h=200&fit=crop', 'Streaming', 14.99, 'USD', 'monthly', 'Prime Video, Music, and more', 'https://amazon.com/prime', true, 3),
('Spotify', 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200&h=200&fit=crop', 'Music', 11.99, 'USD', 'monthly', 'Music streaming service', 'https://spotify.com', true, 4),
('YouTube Premium', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=200&fit=crop', 'Streaming', 13.99, 'USD', 'monthly', 'Ad-free YouTube and Music', 'https://youtube.com/premium', true, 5),
('ChatGPT Plus', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop', 'AI', 20.00, 'USD', 'monthly', 'Advanced AI assistant', 'https://openai.com', true, 6),

-- More Streaming
('Hulu', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&h=200&fit=crop', 'Streaming', 9.99, 'USD', 'monthly', 'TV shows and movies', 'https://hulu.com', false, 7),
('HBO Max', 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=200&h=200&fit=crop', 'Streaming', 15.99, 'USD', 'monthly', 'HBO Original series and movies', 'https://hbomax.com', false, 8),
('Apple TV+', 'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=200&h=200&fit=crop', 'Streaming', 9.99, 'USD', 'monthly', 'Apple Original content', 'https://tv.apple.com', false, 9),
('Paramount+', 'https://images.unsplash.com/photo-1627873649417-c67f701f1949?w=200&h=200&fit=crop', 'Streaming', 7.99, 'USD', 'monthly', 'CBS, MTV, Nickelodeon content', 'https://paramountplus.com', false, 10),
('Peacock', 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=200&h=200&fit=crop', 'Streaming', 7.99, 'USD', 'monthly', 'NBCUniversal content', 'https://peacocktv.com', false, 11),
('Crunchyroll', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop', 'Streaming', 7.99, 'USD', 'monthly', 'Anime streaming', 'https://crunchyroll.com', false, 12),

-- Music
('Apple Music', 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=200&h=200&fit=crop', 'Music', 10.99, 'USD', 'monthly', 'Music streaming by Apple', 'https://music.apple.com', false, 13),
('YouTube Music', 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=200&fit=crop', 'Music', 10.99, 'USD', 'monthly', 'Music streaming from YouTube', 'https://music.youtube.com', false, 14),
('Tidal', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop', 'Music', 10.99, 'USD', 'monthly', 'High-fidelity music streaming', 'https://tidal.com', false, 15),
('Audible', 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&h=200&fit=crop', 'Music', 14.95, 'USD', 'monthly', 'Audiobooks by Amazon', 'https://audible.com', false, 16),

-- Gaming
('Xbox Game Pass', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=200&fit=crop', 'Gaming', 16.99, 'USD', 'monthly', 'Game subscription for Xbox', 'https://xbox.com/gamepass', false, 17),
('PlayStation Plus', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=200&fit=crop', 'Gaming', 17.99, 'USD', 'monthly', 'Online gaming for PlayStation', 'https://playstation.com/ps-plus', false, 18),
('Nintendo Switch Online', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=200&h=200&fit=crop', 'Gaming', 3.99, 'USD', 'monthly', 'Online service for Switch', 'https://nintendo.com', false, 19),
('GeForce Now', 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=200&h=200&fit=crop', 'Gaming', 9.99, 'USD', 'monthly', 'Cloud gaming service', 'https://geforcenow.com', false, 20),

-- Productivity
('Microsoft 365', 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=200&h=200&fit=crop', 'Productivity', 12.50, 'USD', 'monthly', 'Office apps and cloud storage', 'https://microsoft.com/microsoft-365', false, 21),
('Google Workspace', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&h=200&fit=crop', 'Productivity', 12.00, 'USD', 'monthly', 'Gmail, Drive, Docs, and more', 'https://workspace.google.com', false, 22),
('Notion', 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=200&h=200&fit=crop', 'Productivity', 10.00, 'USD', 'monthly', 'All-in-one workspace', 'https://notion.so', false, 23),
('Figma', 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=200&h=200&fit=crop', 'Productivity', 15.00, 'USD', 'monthly', 'Collaborative design tool', 'https://figma.com', false, 24),
('Adobe Creative Cloud', 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=200&h=200&fit=crop', 'Productivity', 54.99, 'USD', 'monthly', 'Photoshop, Illustrator, and more', 'https://adobe.com/creativecloud', false, 25),
('Canva Pro', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&h=200&fit=crop', 'Productivity', 12.99, 'USD', 'monthly', 'Graphic design platform', 'https://canva.com', false, 26),
('Slack', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=200&h=200&fit=crop', 'Productivity', 8.75, 'USD', 'monthly', 'Team communication platform', 'https://slack.com', false, 27),
('Zoom', 'https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=200&h=200&fit=crop', 'Productivity', 14.99, 'USD', 'monthly', 'Video conferencing', 'https://zoom.us', false, 28),

-- Cloud Storage
('Dropbox', 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=200&h=200&fit=crop', 'Cloud', 11.99, 'USD', 'monthly', 'Cloud file storage', 'https://dropbox.com', false, 29),
('Google One', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200&h=200&fit=crop', 'Cloud', 9.99, 'USD', 'monthly', 'Expanded Google storage', 'https://one.google.com', false, 30),
('iCloud+', 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=200&h=200&fit=crop', 'Cloud', 9.99, 'USD', 'monthly', 'Apple cloud storage', 'https://apple.com/icloud', false, 31),

-- Security
('NordVPN', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop', 'Security', 11.99, 'USD', 'monthly', 'VPN service', 'https://nordvpn.com', false, 32),
('1Password', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop', 'Security', 7.99, 'USD', 'monthly', 'Password manager', 'https://1password.com', false, 33),
('LastPass', 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=200&h=200&fit=crop', 'Security', 3.00, 'USD', 'monthly', 'Password management', 'https://lastpass.com', false, 34),

-- Fitness
('Peloton', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&h=200&fit=crop', 'Fitness', 44.00, 'USD', 'monthly', 'Fitness classes', 'https://onepeloton.com', false, 35),
('Apple Fitness+', 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=200&h=200&fit=crop', 'Fitness', 9.99, 'USD', 'monthly', 'Workout videos', 'https://fitness.apple.com', false, 36),

-- News
('The New York Times', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=200&fit=crop', 'News', 17.00, 'USD', 'monthly', 'Digital news subscription', 'https://nytimes.com', false, 37),
('Medium', 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=200&fit=crop', 'News', 5.00, 'USD', 'monthly', 'Online publishing platform', 'https://medium.com', false, 38),

-- Learning
('Coursera', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200&h=200&fit=crop', 'Learning', 59.00, 'USD', 'monthly', 'Online courses', 'https://coursera.org', false, 39),
('Udemy', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200&h=200&fit=crop', 'Learning', 29.99, 'USD', 'monthly', 'Online learning platform', 'https://udemy.com', false, 40),
('LinkedIn Learning', 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=200&h=200&fit=crop', 'Learning', 39.99, 'USD', 'monthly', 'Professional development courses', 'https://linkedin.com/learning', false, 41),
('Duolingo Plus', 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=200&h=200&fit=crop', 'Learning', 6.99, 'USD', 'monthly', 'Language learning app', 'https://duolingo.com', false, 42);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_templates_updated_at
  BEFORE UPDATE ON subscription_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();