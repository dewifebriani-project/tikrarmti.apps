-- Create study_partners table for managing pairing assignments
CREATE TABLE IF NOT EXISTS public.study_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Batch reference
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

  -- The two paired users (user_1_id should always be < user_2_id to prevent duplicates)
  user_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CHECK (user_1_id < user_2_id),

  -- Pairing metadata
  pairing_type TEXT NOT NULL CHECK (pairing_type IN ('self_match', 'system_match', 'family', 'tarteel')),
  pairing_status TEXT NOT NULL DEFAULT 'active' CHECK (pairing_status IN ('active', 'inactive', 'paused')),

  -- Admin who created this pairing
  paired_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Notes
  notes TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_partners_batch_id ON public.study_partners(batch_id);
CREATE INDEX IF NOT EXISTS idx_study_partners_user_1_id ON public.study_partners(user_1_id);
CREATE INDEX IF NOT EXISTS idx_study_partners_user_2_id ON public.study_partners(user_2_id);
CREATE INDEX IF NOT EXISTS idx_study_partners_pairing_status ON public.study_partners(pairing_status);

-- Add comments
COMMENT ON TABLE public.study_partners IS 'Stores study partner pairings for Tikrar Tahfidz program';
COMMENT ON COLUMN public.study_partners.batch_id IS 'Batch this pairing belongs to';
COMMENT ON COLUMN public.study_partners.user_1_id IS 'First user in the pair';
COMMENT ON COLUMN public.study_partners.user_2_id IS 'Second user in the pair';
COMMENT ON COLUMN public.study_partners.pairing_type IS 'Type of pairing: self_match, system_match, family, or tarteel';
COMMENT ON COLUMN public.study_partners.pairing_status IS 'Status of pairing: active, inactive, or paused';
COMMENT ON COLUMN public.study_partners.paired_by IS 'Admin who created this pairing';
COMMENT ON COLUMN public.study_partners.paired_at IS 'When the pairing was created';

-- Enable RLS
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage pairings, users can read their own pairings
CREATE POLICY "Admins can view all pairings"
ON public.study_partners
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  )
);

CREATE POLICY "Users can view their own pairings"
ON public.study_partners
FOR SELECT
TO authenticated
USING (user_1_id = auth.uid() OR user_2_id = auth.uid());

CREATE POLICY "Admins can create pairings"
ON public.study_partners
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  )
);

CREATE POLICY "Admins can update pairings"
ON public.study_partners
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  )
);

CREATE POLICY "Admins can delete pairings"
ON public.study_partners
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
  )
);

-- Add pairing_status column to daftar_ulang_submissions
ALTER TABLE public.daftar_ulang_submissions
ADD COLUMN IF NOT EXISTS pairing_status TEXT DEFAULT 'pending' CHECK (pairing_status IN ('pending', 'paired', 'rejected'));

ALTER TABLE public.daftar_ulang_submissions
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN public.daftar_ulang_submissions.pairing_status IS 'Status of pairing request: pending, paired, or rejected';
COMMENT ON COLUMN public.daftar_ulang_submissions.rejection_reason IS 'Reason for rejecting pairing request (if applicable)';
