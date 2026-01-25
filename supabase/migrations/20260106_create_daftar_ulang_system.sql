-- Migration: Create Daftar Ulang System
-- This migration creates tables for the re-enrollment (daftar ulang) system

-- Table: daftar_ulang_submissions
-- Stores the main daftar ulang submission data
CREATE TABLE IF NOT EXISTS public.daftar_ulang_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id),

  -- Confirmed data from registration
  confirmed_full_name VARCHAR NOT NULL,
  confirmed_chosen_juz VARCHAR NOT NULL,
  confirmed_main_time_slot VARCHAR NOT NULL,
  confirmed_backup_time_slot VARCHAR NOT NULL,
  confirmed_wa_phone VARCHAR,
  confirmed_address TEXT,

  -- Partner selection
  partner_type VARCHAR NOT NULL CHECK (partner_type IN ('self_match', 'system_match', 'family', 'tarteel')),
  partner_user_id UUID REFERENCES public.users(id), -- For self_match
  partner_name VARCHAR, -- For family and tarteel
  partner_relationship VARCHAR, -- For family (ayah, ibu, anak, saudara, mahram)
  partner_notes TEXT,

  -- Halaqah selection
  ujian_halaqah_id UUID REFERENCES public.halaqah(id),
  tashih_halaqah_id UUID REFERENCES public.halaqah(id),
  is_tashih_umum BOOLEAN DEFAULT FALSE, -- If true, uses general tashih class

  -- Akad submission
  akad_url TEXT,
  akad_file_name VARCHAR,
  akad_submitted_at TIMESTAMPTZ,

  -- Status tracking
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  review_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT daftar_ulang_submissions_user_id_key UNIQUE (user_id, registration_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_user_id ON public.daftar_ulang_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_registration_id ON public.daftar_ulang_submissions(registration_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_batch_id ON public.daftar_ulang_submissions(batch_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_status ON public.daftar_ulang_submissions(status);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_ujian_halaqah ON public.daftar_ulang_submissions(ujian_halaqah_id);
CREATE INDEX IF NOT EXISTS idx_daftar_ulang_submissions_tashih_halaqah ON public.daftar_ulang_submissions(tashih_halaqah_id);

-- Table: partner_preferences
-- Stores partner preferences for self-matching
CREATE TABLE IF NOT EXISTS public.partner_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_partner_id UUID REFERENCES public.users(id),
  registration_id UUID NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT partner_preferences_user_partner_unique UNIQUE (user_id, preferred_partner_id, registration_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_preferences_user_id ON public.partner_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_preferences_preferred_partner_id ON public.partner_preferences(preferred_partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_preferences_status ON public.partner_preferences(status);

-- Table: halaqah_class_types
-- Links halaqah to class types (ujian, tashih, or both)
CREATE TABLE IF NOT EXISTS public.halaqah_class_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  halaqah_id UUID NOT NULL REFERENCES public.halaqah(id) ON DELETE CASCADE,
  class_type VARCHAR NOT NULL CHECK (class_type IN ('tashih_ujian', 'tashih_only', 'ujian_only')),
  current_students INTEGER DEFAULT 0,
  max_students INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT halaqah_class_types_halaqah_type_unique UNIQUE (halaqah_id, class_type)
);

-- Enable RLS
ALTER TABLE public.daftar_ulang_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaqah_class_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daftar_ulang_submissions

-- Users can view their own submissions
CREATE POLICY "Users can view own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own submissions
CREATE POLICY "Users can insert own daftar ulang"
  ON public.daftar_ulang_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own draft submissions
CREATE POLICY "Users can update own draft daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid() AND status = 'draft');

-- Admins can view all submissions
CREATE POLICY "Admins can view all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can update all submissions
CREATE POLICY "Admins can update all daftar ulang"
  ON public.daftar_ulang_submissions
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for partner_preferences

-- Users can view their own partner preferences
CREATE POLICY "Users can view own partner preferences"
  ON public.partner_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view preferences where they are the preferred partner
CREATE POLICY "Users can view partner preferences for themselves"
  ON public.partner_preferences
  FOR SELECT
  TO authenticated
  USING (preferred_partner_id = auth.uid());

-- Users can insert their own partner preferences
CREATE POLICY "Users can insert own partner preferences"
  ON public.partner_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own partner preferences
CREATE POLICY "Users can update own partner preferences"
  ON public.partner_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can update status if they are the preferred partner
CREATE POLICY "Partners can accept/reject partner preferences"
  ON public.partner_preferences
  FOR UPDATE
  TO authenticated
  USING (preferred_partner_id = auth.uid())
  WITH CHECK (preferred_partner_id = auth.uid());

-- Admins can view all partner preferences
CREATE POLICY "Admins can view all partner preferences"
  ON public.partner_preferences
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- RLS Policies for halaqah_class_types

-- Everyone can view active class types
CREATE POLICY "Everyone can view halaqah class types"
  ON public.halaqah_class_types
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Admins can view all class types
CREATE POLICY "Admins can view all halaqah class types"
  ON public.halaqah_class_types
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can insert class types
CREATE POLICY "Admins can insert halaqah class types"
  ON public.halaqah_class_types
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Admins can update class types
CREATE POLICY "Admins can update halaqah class types"
  ON public.halaqah_class_types
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Add comments for documentation
COMMENT ON TABLE public.daftar_ulang_submissions IS 'Stores daftar ulang (re-enrollment) submissions for selected thalibah';
COMMENT ON TABLE public.partner_preferences IS 'Stores partner preferences for self-matching system';
COMMENT ON TABLE public.halaqah_class_types IS 'Links halaqah to class types (ujian, tashih, or both)';

COMMENT ON COLUMN public.daftar_ulang_submissions.partner_type IS 'Type of partner: self_match (choose own), system_match (auto-assigned), family (mahram), tarteel (app)';
COMMENT ON COLUMN public.daftar_ulang_submissions.is_tashih_umum IS 'If true, thalibah uses general tashih class instead of specific halaqah';
