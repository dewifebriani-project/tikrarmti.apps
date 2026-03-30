-- =====================================================
-- CREATE USERS TABLE - Exact structure from old project
-- Jalankan di Project BARU: https://lhqbqzrghdbbmstnhple.supabase.co
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing users table if exists
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with exact columns from export
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email character varying NOT NULL UNIQUE,
  password_hash character varying,
  full_name character varying,
  role character varying DEFAULT 'thalibah',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  provinsi text,
  kota text,
  alamat text,
  whatsapp text,
  telegram text,
  zona_waktu text DEFAULT 'WIB',
  tanggal_lahir date,
  tempat_lahir text,
  pekerjaan text,
  alasan_daftar text,
  jenis_kelamin character varying,
  negara character varying,
  nama_kunyah text,
  roles text[],
  current_tikrar_batch_id uuid,
  name character varying,  -- Additional column from export
  is_blacklisted boolean DEFAULT false,
  blacklist_reason text,
  blacklisted_at timestamp with time zone,
  blacklist_notes text,
  blacklist_by uuid
);

-- Add index for email
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Add index for roles (for faster queries)
CREATE INDEX IF NOT EXISTS users_roles_idx ON public.users USING GIN(roles);

-- Add index for is_active
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);

-- Verify table created
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
