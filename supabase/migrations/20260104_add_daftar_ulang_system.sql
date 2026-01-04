-- Migration: Daftar Ulang (Re-enrollment) System
-- This migration creates tables for the complete re-enrollment process including:
-- Partner selection (pasangan setoran), Akad commitments, and alternative options

-- ============================================================================
-- TABLE: study_partner_preferences
-- Stores thalibah's preferences for study partners
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.study_partner_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,

  -- Partner type: 'thalibah', 'family', 'tarteel'
  partner_type VARCHAR(20) NOT NULL CHECK (partner_type IN ('thalibah', 'family', 'tarteel')),

  -- For thalibah partner: mutual selection (pending when only one has selected)
  preferred_partner_id UUID REFERENCES public.users(id),
  partner_status VARCHAR(20) DEFAULT 'pending' CHECK (partner_status IN ('pending', 'mutual', 'rejected', 'cancelled')),

  -- For family partner
  family_member_name TEXT,
  family_member_relationship TEXT,

  -- For tarteel app option
  tarteel_commitment BOOLEAN DEFAULT false,
  daily_proof_method TEXT,

  -- Partner matching criteria (must match)
  preferred_time_slot VARCHAR(100),
  preferred_juz VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_thalibah_partner CHECK (
    (partner_type = 'thalibah' AND preferred_partner_id IS NOT NULL) OR
    (partner_type = 'family' AND family_member_name IS NOT NULL) OR
    (partner_type = 'tarteel' AND tarteel_commitment = true)
  )
);

-- Indexes for study_partner_preferences
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_registration ON public.study_partner_preferences(registration_id);
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_user ON public.study_partner_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_batch ON public.study_partner_preferences(batch_id);
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_partner ON public.study_partner_preferences(preferred_partner_id) WHERE preferred_partner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_status ON public.study_partner_preferences(partner_status);
CREATE INDEX IF NOT EXISTS idx_study_partner_prefs_type ON public.study_partner_preferences(partner_type);

-- Comments
COMMENT ON TABLE public.study_partner_preferences IS 'Stores study partner preferences during daftar ulang process';
COMMENT ON COLUMN public.study_partner_preferences.partner_type IS 'Type of partner: thalibah (fellow student), family member, or tarteel app';
COMMENT ON COLUMN public.study_partner_preferences.partner_status IS 'Status for thalibah partnerships: pending (one-sided), mutual (both selected), rejected, cancelled';

-- ============================================================================
-- TABLE: akad_commitments
-- Stores the signed akad (commitment agreement) from thalibah
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.akad_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,

  -- Akad content (commitment summary from registration form)
  akad_content JSONB NOT NULL,

  -- Signed status
  agreed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  signature_ip INET,

  -- File upload for signed akad (optional)
  akad_file_path TEXT,
  akad_file_name TEXT,
  akad_file_uploaded_at TIMESTAMPTZ,

  -- Verification
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for akad_commitments
CREATE INDEX IF NOT EXISTS idx_akad_registration ON public.akad_commitments(registration_id);
CREATE INDEX IF NOT EXISTS idx_akad_user ON public.akad_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_akad_batch ON public.akad_commitments(batch_id);

-- Comments
COMMENT ON TABLE public.akad_commitments IS 'Stores signed akad (commitment agreement) for thalibah daftar ulang';
COMMENT ON COLUMN public.akad_commitments.akad_content IS 'JSONB content of the akad with commitment summary';

-- ============================================================================
-- TABLE: ustadzah_preferences
-- Stores thalibah's preferences for ustadzah/muallimah assignment
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ustadzah_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.pendaftaran_tikrar_tahfidz(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,

  -- Class type preferences (based on assigned halaqah)
  -- This is informational - actual assignment is done by admin
  preferred_muallimah_tashih UUID REFERENCES public.users(id),
  preferred_muallimah_ujian UUID REFERENCES public.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ustadzah_preferences
CREATE INDEX IF NOT EXISTS idx_ustadzah_prefs_registration ON public.ustadzah_preferences(registration_id);
CREATE INDEX IF NOT EXISTS idx_ustadzah_prefs_user ON public.ustadzah_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ustadzah_prefs_batch ON public.ustadzah_preferences(batch_id);

-- Comments
COMMENT ON TABLE public.ustadzah_preferences IS 'Stores thalibah preferences for muallimah/ustadzah assignment';

-- ============================================================================
-- RLS POLICIES: study_partner_preferences
-- ============================================================================
ALTER TABLE public.study_partner_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own study_partner_preferences" ON public.study_partner_preferences;
DROP POLICY IF EXISTS "Admins can view all study_partner_preferences" ON public.study_partner_preferences;
DROP POLICY IF EXISTS "Muallimah can view study partners in their batch" ON public.study_partner_preferences;

-- Users can view and manage their own study partner preferences
CREATE POLICY "Users can manage own study_partner_preferences"
  ON public.study_partner_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can view preferences of potential partners who selected them
CREATE POLICY "Users can view partners who selected them"
  ON public.study_partner_preferences
  FOR SELECT
  TO authenticated
  USING (
    preferred_partner_id = auth.uid() AND
    partner_status = 'pending'
  );

-- Admins can view and manage all study partner preferences
CREATE POLICY "Admins can manage all study_partner_preferences"
  ON public.study_partner_preferences
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ============================================================================
-- RLS POLICIES: akad_commitments
-- ============================================================================
ALTER TABLE public.akad_commitments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own akad_commitments" ON public.akad_commitments;
DROP POLICY IF EXISTS "Admins can view all akad_commitments" ON public.akad_commitments;

-- Users can view and manage their own akad commitments
CREATE POLICY "Users can manage own akad_commitments"
  ON public.akad_commitments
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view, verify, and manage all akad commitments
CREATE POLICY "Admins can manage all_akad_commitments"
  ON public.akad_commitments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ============================================================================
-- RLS POLICIES: ustadzah_preferences
-- ============================================================================
ALTER TABLE public.ustadzah_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own ustadzah_preferences" ON public.ustadzah_preferences;
DROP POLICY IF EXISTS "Admins can view all ustadzah_preferences" ON public.ustadzah_preferences;

-- Users can view and manage their own ustadzah preferences
CREATE POLICY "Users can manage own ustadzah_preferences"
  ON public.ustadzah_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all ustadzah preferences
CREATE POLICY "Admins can view all ustadzah_preferences"
  ON public.ustadzah_preferences
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- Muallimah can view preferences where they are preferred
CREATE POLICY "Muallimah can view their own preferences"
  ON public.ustadzah_preferences
  FOR SELECT
  TO authenticated
  USING (
    preferred_muallimah_tashih = auth.uid() OR
    preferred_muallimah_ujian = auth.uid()
  );

-- ============================================================================
-- STORAGE BUCKET: akad_files
-- For storing uploaded signed akad documents
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'akad_files',
  'akad_files',
  false, -- private bucket
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for akad_files bucket
DROP POLICY IF EXISTS "Users can upload own akad files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own akad files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all akad files" ON storage.objects;

-- Users can upload their own akad files
CREATE POLICY "Users can upload own akad files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'akad_files' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can view their own akad files
CREATE POLICY "Users can view own akad files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'akad_files' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Admins can manage all akad files
CREATE POLICY "Admins can manage all akad files"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'akad_files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  )
  WITH CHECK (
    bucket_id = 'akad_files' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
DROP TRIGGER IF EXISTS update_study_partner_preferences_updated_at ON public.study_partner_preferences;
CREATE TRIGGER update_study_partner_preferences_updated_at
  BEFORE UPDATE ON public.study_partner_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_akad_commitments_updated_at ON public.akad_commitments;
CREATE TRIGGER update_akad_commitments_updated_at
  BEFORE UPDATE ON public.akad_commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ustadzah_preferences_updated_at ON public.ustadzah_preferences;
CREATE TRIGGER update_ustadzah_preferences_updated_at
  BEFORE UPDATE ON public.ustadzah_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Find compatible study partners
-- Returns potential partners based on matching criteria (time slot, juz)
-- ============================================================================
CREATE OR REPLACE FUNCTION find_compatible_study_partners(
  p_user_id UUID,
  p_batch_id UUID,
  p_time_slot VARCHAR,
  p_juz VARCHAR
)
RETURNS TABLE (
  partner_id UUID,
  partner_name VARCHAR,
  partner_juz VARCHAR,
  partner_time_slot VARCHAR,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS partner_id,
    u.full_name::VARCHAR AS partner_name,
    pt.chosen_juz::VARCHAR AS partner_juz,
    pt.main_time_slot::VARCHAR AS partner_time_slot,
    -- Calculate match score
    CASE
      WHEN pt.chosen_juz = p_juz AND pt.main_time_slot = p_time_slot THEN 100
      WHEN pt.chosen_juz = p_juz THEN 50
      WHEN pt.main_time_slot = p_time_slot THEN 50
      ELSE 0
    END AS match_score
  FROM public.users u
  INNER JOIN public.pendaftaran_tikrar_tahfidz pt ON pt.user_id = u.id
  WHERE pt.batch_id = p_batch_id
    AND pt.selection_status = 'selected'
    AND u.id != p_user_id
    AND (
      -- Juz matches (exact or comma-separated)
      pt.chosen_juz = p_juz OR
      pt.chosen_juz LIKE '%' || p_juz || '%' OR
      p_juz LIKE '%' || pt.chosen_juz || '%'
    )
    AND (
      -- Time slot matches
      pt.main_time_slot = p_time_slot OR
      pt.backup_time_slot = p_time_slot
    )
    -- Not already partnered (no mutual partnership)
    AND NOT EXISTS (
      SELECT 1 FROM public.study_partner_preferences spp
      WHERE spp.user_id = u.id
        AND spp.partner_status = 'mutual'
    )
  ORDER BY match_score DESC, u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION find_compatible_study_partengers IS 'Returns compatible study partners based on juz and time slot matching';

-- ============================================================================
-- FUNCTION: Update mutual partnership status
-- Called when a user selects a partner to check if the partner also selected them
-- ============================================================================
CREATE OR REPLACE FUNCTION update_mutual_partnership()
RETURNS TRIGGER AS $$
DECLARE
  reciprocal_preference RECORD;
BEGIN
  -- Only for thalibah partner type
  IF NEW.partner_type = 'thalibah' AND NEW.preferred_partner_id IS NOT NULL THEN
    -- Check if the preferred partner also selected this user
    SELECT * INTO reciprocal_preference
    FROM public.study_partner_preferences
    WHERE user_id = NEW.preferred_partner_id
      AND preferred_partner_id = NEW.user_id
      AND partner_type = 'thalibah'
    LIMIT 1;

    -- If mutual selection exists, update both to mutual status
    IF FOUND THEN
      UPDATE public.study_partner_preferences
      SET partner_status = 'mutual',
          updated_at = NOW()
      WHERE id = NEW.id;

      UPDATE public.study_partner_preferences
      SET partner_status = 'mutual',
          updated_at = NOW()
      WHERE id = reciprocal_preference.id;

      -- Audit log for mutual partnership
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (
        NEW.user_id,
        'mutual_partnership_established',
        'study_partner_preferences',
        NEW.id,
        jsonb_build_object(
          'partner_id', NEW.preferred_partner_id,
          'batch_id', NEW.batch_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic mutual partnership detection
DROP TRIGGER IF EXISTS on_study_partner_preference_insert ON public.study_partner_preferences;
CREATE TRIGGER on_study_partner_preference_insert
  AFTER INSERT OR UPDATE ON public.study_partner_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_mutual_partnership();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_partner_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.akad_commitments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ustadzah_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION find_compatible_study_partners(UUID, UUID, VARCHAR, VARCHAR) TO authenticated;
