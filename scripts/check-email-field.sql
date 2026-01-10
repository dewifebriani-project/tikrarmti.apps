-- Check if email field exists in pendaftaran_tikrar_tahfidz
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pendaftaran_tikrar_tahfidz'
  AND column_name IN ('email', 'wa_phone', 'contact_email')
ORDER BY column_name;

-- Sample data to see what's in wa_phone
SELECT id, user_id, full_name, wa_phone, email
FROM pendaftaran_tikrar_tahfidz
LIMIT 5;

-- Check if we can match by full_name instead
SELECT
  pt.id,
  pt.user_id,
  pt.full_name,
  pt.wa_phone,
  au.id as auth_user_id,
  au.email as auth_email
FROM pendaftaran_tikrar_tahfidz pt
LEFT JOIN auth.users au ON au.id = pt.user_id
WHERE pt.full_name ILIKE '%Agustina%';
