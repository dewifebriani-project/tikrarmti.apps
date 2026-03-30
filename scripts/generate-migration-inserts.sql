-- =====================================================
-- GENERATOR: Buat INSERT statements untuk migrasi
-- Jalankan ini di PROJECT LAMA
-- Copy hasilnya dan jalankan di PROJECT BARU
-- =====================================================

-- Helper function untuk generate INSERT (jalankan di project LAMA)
-- Ini akan menghasilkan INSERT statements yang siap di-copy-paste

-- Untuk users table:
SELECT
  'INSERT INTO public.users (id, email, full_name, roles, role, is_active, is_blacklisted, whatsapp, telegram, negara, provinsi, kota, alamat, zona_waktu, jenis_kelamin, tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar, created_at, updated_at) VALUES ' ||
  '(' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(email) || ', ' ||
  quote_literal(full_name) || ', ' ||
  quote_literal(ARRAY_TO_STRING(roles, ',')) || '::text[][], ' ||  -- Fix array type
  quote_literal(role) || ', ' ||
  is_active || ', ' ||
  is_blacklisted || ', ' ||
  COALESCE(quote_literal(whatsapp), 'NULL') || ', ' ||
  COALESCE(quote_literal(telegram), 'NULL') || ', ' ||
  COALESCE(quote_literal(negara), 'NULL') || ', ' ||
  COALESCE(quote_literal(provinsi), 'NULL') || ', ' ||
  COALESCE(quote_literal(kota), 'NULL') || ', ' ||
  COALESCE(quote_literal(alamat), 'NULL') || ', ' ||
  COALESCE(quote_literal(zona_waktu), 'NULL') || ', ' ||
  COALESCE(quote_literal(jenis_kelamin), 'NULL') || ', ' ||
  COALESCE(quote_literal(tanggal_lahir::text), 'NULL') || '::timestamp, ' ||
  COALESCE(quote_literal(tempat_lahir), 'NULL') || ', ' ||
  COALESCE(quote_literal(pekerjaan), 'NULL') || ', ' ||
  COALESCE(quote_literal(alasan_daftar), 'NULL') || ', ' ||
  quote_literal(created_at::text) || '::timestamp, ' ||
  quote_literal(updated_at::text) || '::timestamp' ||
  ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM public.users
LIMIT 10;  -- Increase limit or remove to get all rows

-- Untuk batches table:
SELECT
  'INSERT INTO public.batches (id, name, description, start_date, end_date, registration_start_date, registration_end_date, status, duration_weeks, is_free, price, total_quota, program_type, created_at, updated_at) VALUES ' ||
  '(' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(name) || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  quote_literal(start_date::text) || '::date, ' ||
  quote_literal(end_date::text) || '::date, ' ||
  COALESCE(quote_literal(registration_start_date::text), 'NULL') || '::timestamp, ' ||
  COALESCE(quote_literal(registration_end_date::text), 'NULL') || '::timestamp, ' ||
  quote_literal(status) || ', ' ||
  duration_weeks || ', ' ||
  is_free || ', ' ||
  price || ', ' ||
  total_quota || ', ' ||
  COALESCE(quote_literal(program_type), 'NULL') || ', ' ||
  quote_literal(created_at::text) || '::timestamp, ' ||
  quote_literal(updated_at::text) || '::timestamp' ||
  ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM public.batches;

-- Untuk pendaftaran_tikrar_tahfidz (registrations):
SELECT
  'INSERT INTO public.pendaftaran_tikrar_tahfidz (id, user_id, batch_id, chosen_juz, main_time_slot, backup_time_slot, created_at, updated_at) VALUES ' ||
  '(' ||
  quote_literal(id::text) || ', ' ||
  quote_literal(user_id::text) || ', ' ||
  quote_literal(batch_id::text) || ', ' ||
  quote_literal(chosen_juz) || ', ' ||
  quote_literal(main_time_slot) || ', ' ||
  quote_literal(backup_time_slot) || ', ' ||
  quote_literal(created_at::text) || '::timestamp, ' ||
  quote_literal(updated_at::text) || '::timestamp' ||
  ') ON CONFLICT (id) DO NOTHING;' as insert_statement
FROM public.pendaftaran_tikrar_tahfidz;
