-- FIX PHONE NUMBER FORMAT
-- Convert +62085... to +6285... (remove leading 0 after +62)
-- This script fixes WhatsApp and Telegram phone numbers in users table

-- IMPORTANT: Run this in Supabase SQL Editor

BEGIN;

-- First, let's see the current data before making changes
SELECT
  id,
  full_name,
  whatsapp as old_whatsapp,
  telegram as old_telegram,
  CASE
    WHEN whatsapp LIKE '+620%' THEN REPLACE(whatsapp, '+620', '+62')
    ELSE whatsapp
  END as new_whatsapp,
  CASE
    WHEN telegram LIKE '+620%' THEN REPLACE(telegram, '+620', '+62')
    ELSE telegram
  END as new_telegram
FROM users
WHERE whatsapp LIKE '+620%' OR telegram LIKE '+620%'
ORDER BY created_at DESC;

-- Show count of records that will be updated
SELECT
  COUNT(*) as total_records_to_update,
  COUNT(CASE WHEN whatsapp LIKE '+620%' THEN 1 END) as whatsapp_to_fix,
  COUNT(CASE WHEN telegram LIKE '+620%' THEN 1 END) as telegram_to_fix
FROM users
WHERE whatsapp LIKE '+620%' OR telegram LIKE '+620%';

-- Update WhatsApp numbers
-- Convert +62085... to +6285...
UPDATE users
SET whatsapp = REPLACE(whatsapp, '+620', '+62'),
    updated_at = NOW()
WHERE whatsapp LIKE '+620%';

-- Update Telegram numbers
-- Convert +62085... to +6285...
UPDATE users
SET telegram = REPLACE(telegram, '+620', '+62'),
    updated_at = NOW()
WHERE telegram LIKE '+620%';

-- ====================================
-- FIX pendaftaran_tikrar_tahfidz TABLE
-- ====================================

-- Update wa_phone in tikrar table
UPDATE pendaftaran_tikrar_tahfidz
SET wa_phone = REPLACE(wa_phone, '+620', '+62')
WHERE wa_phone LIKE '+620%';

-- Update telegram_phone in tikrar table
UPDATE pendaftaran_tikrar_tahfidz
SET telegram_phone = REPLACE(telegram_phone, '+620', '+62')
WHERE telegram_phone LIKE '+620%';

-- Verify the changes
SELECT
  id,
  full_name,
  whatsapp,
  telegram,
  updated_at
FROM users
WHERE whatsapp LIKE '+62%' OR telegram LIKE '+62%'
ORDER BY updated_at DESC
LIMIT 20;

-- Show summary after update
SELECT
  'WhatsApp' as field,
  COUNT(*) as total_records,
  COUNT(CASE WHEN whatsapp LIKE '+6285%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN whatsapp LIKE '+62085%' THEN 1 END) as wrong_format_085,
  COUNT(CASE WHEN whatsapp LIKE '+620%' AND whatsapp NOT LIKE '+62085%' THEN 1 END) as other_wrong_format
FROM users
WHERE whatsapp IS NOT NULL AND whatsapp != ''
UNION ALL
SELECT
  'Telegram' as field,
  COUNT(*) as total_records,
  COUNT(CASE WHEN telegram LIKE '+6285%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN telegram LIKE '+62085%' THEN 1 END) as wrong_format_085,
  COUNT(CASE WHEN telegram LIKE '+620%' AND telegram NOT LIKE '+62085%' THEN 1 END) as other_wrong_format
FROM users
WHERE telegram IS NOT NULL AND telegram != ''
UNION ALL
SELECT
  'Tikrar WA Phone' as field,
  COUNT(*) as total_records,
  COUNT(CASE WHEN wa_phone LIKE '+6285%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN wa_phone LIKE '+62085%' THEN 1 END) as wrong_format_085,
  COUNT(CASE WHEN wa_phone LIKE '+620%' AND wa_phone NOT LIKE '+62085%' THEN 1 END) as other_wrong_format
FROM pendaftaran_tikrar_tahfidz
WHERE wa_phone IS NOT NULL AND wa_phone != ''
UNION ALL
SELECT
  'Tikrar Telegram Phone' as field,
  COUNT(*) as total_records,
  COUNT(CASE WHEN telegram_phone LIKE '+6285%' THEN 1 END) as correct_format,
  COUNT(CASE WHEN telegram_phone LIKE '+62085%' THEN 1 END) as wrong_format_085,
  COUNT(CASE WHEN telegram_phone LIKE '+620%' AND telegram_phone NOT LIKE '+62085%' THEN 1 END) as other_wrong_format
FROM pendaftaran_tikrar_tahfidz
WHERE telegram_phone IS NOT NULL AND telegram_phone != '';

COMMIT;

-- Optional: Check for other potential issues
-- Numbers that don't start with +62 (might be incorrect)
SELECT
  id,
  full_name,
  whatsapp,
  telegram
FROM users
WHERE
  (whatsapp IS NOT NULL AND whatsapp != '' AND whatsapp NOT LIKE '+62%')
  OR (telegram IS NOT NULL AND telegram != '' AND telegram NOT LIKE '+62%')
ORDER BY created_at DESC;
