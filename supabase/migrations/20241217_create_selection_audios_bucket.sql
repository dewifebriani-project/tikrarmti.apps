-- Create storage bucket for selection audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'selection-audios',
  'selection-audios',
  true, -- public bucket so we can serve files via public URL
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp3', 'audio/mpeg']
) ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
-- 1. Allow anonymous users to read files (public access)
CREATE POLICY "Allow anonymous users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios');

-- 2. Allow authenticated users to upload their own selection audio
CREATE POLICY "Allow users to upload selection audios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- 3. Allow users to update their own selection audio files
CREATE POLICY "Allow users to update own selection audios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'selection-audios' AND
  auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to read files (in case RLS blocks anonymous)
CREATE POLICY "Allow authenticated users to read selection audios"
ON storage.objects FOR SELECT
USING (bucket_id = 'selection-audios' AND auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT SELECT ON storage.objects TO anon;

-- Add comments
COMMENT ON TABLE storage.buckets IS 'Storage buckets configuration';