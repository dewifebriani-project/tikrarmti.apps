-- Update bucket limits to allow larger files and HEIC/WEBP
DO $$
BEGIN
  UPDATE storage.buckets 
  SET 
    file_size_limit = 10485760, -- 10MB
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  WHERE id = 'documents';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update bucket: %', SQLERRM;
END $$;
