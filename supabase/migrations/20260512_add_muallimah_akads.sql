-- Migration to decouple Muallimah Registration from Batches
-- 1. Create muallimah_akads table (Contract per Batch)
CREATE TABLE IF NOT EXISTS public.muallimah_akads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    
    -- Academic Contract Info (Specific to this batch)
    class_type VARCHAR(50) DEFAULT 'tashih_ujian', -- Default single package
    preferred_juz VARCHAR(100),
    preferred_max_thalibah INTEGER DEFAULT 10,
    preferred_schedule TEXT, -- JSON string or comma-separated
    backup_schedule TEXT,
    
    -- Agreement
    understands_commitment BOOLEAN DEFAULT FALSE,
    akad_signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status in this batch
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one user per batch akad
    UNIQUE(user_id, batch_id)
);

-- 2. Add RLS for muallimah_akads
ALTER TABLE public.muallimah_akads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own akads
CREATE POLICY "Users can view own muallimah_akads" 
ON public.muallimah_akads FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Admins can view all akads
CREATE POLICY "Admins can view all muallimah_akads" 
ON public.muallimah_akads FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND 'admin' = ANY(roles)
  )
);

-- Policy: Users can insert their own akads
CREATE POLICY "Users can insert own muallimah_akads"
ON public.muallimah_akads FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Modify muallimah_registrations to be batch-independent (Profile)
-- Note: We keep batch_id for legacy but make it nullable or just ignore it in new logic
ALTER TABLE public.muallimah_registrations ALTER COLUMN batch_id DROP NOT NULL;

-- Add updated_at trigger for muallimah_akads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_muallimah_akads_updated_at
BEFORE UPDATE ON public.muallimah_akads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
