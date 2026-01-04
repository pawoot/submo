-- Create storage bucket for template logos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for template logos
CREATE POLICY "Anyone can view template logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

CREATE POLICY "Admins can upload template logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public' 
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update template logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete template logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public'
  AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);