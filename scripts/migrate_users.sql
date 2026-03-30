-- =====================================================
-- MIGRASI DATA: users table
-- Source: https://nmbvklixthlqtkkgqnjl.supabase.co
-- Target: https://lhqbqzrghdbbmstnhple.supabase.co
-- =====================================================

-- STEP 1: Di PROJECT LAMA - Export data
-- Copy hasil query ini, lalu jalankan di project baru

-- Export query (jalankan di project LAMA):
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users;

-- Full export (jalankan di project LAMA, copy hasilnya):
-- Setelah copy, jalankan sebagai INSERT di project BARU

-- Sample format for project BARU (INSERT statement):
/*
INSERT INTO public.users (
  id, email, full_name, roles, role, is_active, is_blacklisted,
  whatsapp, telegram, negara, provinsi, kota, alamat, zona_waktu,
  jenis_kelamin, tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar,
  created_at, updated_at
) VALUES
  (uuid1, 'email1@example.com', 'Nama Lengkap', ARRAY['thalibah'], 'thalibah', true, false, NULL, NULL, NULL, NULL, NULL, NULL, 'WIB', NULL, NULL, NULL, NULL, NULL, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z'),
  (uuid2, 'email2@example.com', 'Nama Lengkap 2', ARRAY['admin', 'thalibah'], 'thalibah', true, false, NULL, NULL, NULL, NULL, NULL, NULL, 'WIB', NULL, NULL, NULL, NULL, NULL, '2024-01-02T00:00:00Z', '2024-01-02T00:00:00Z')
  -- ... add more rows
ON CONFLICT (id) DO NOTHING; -- Skip jika ID sudah ada
*/

-- Verify count setelah import (jalankan di project BARU):
-- SELECT COUNT(*) FROM public.users;
