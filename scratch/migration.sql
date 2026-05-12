-- Create muallimah_akads table
CREATE TABLE IF NOT EXISTS muallimah_akads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    
    -- Akad specific fields
    preferred_juz TEXT NOT NULL,
    preferred_schedule TEXT NOT NULL, -- JSON string
    backup_schedule TEXT, -- JSON string
    max_thalibah INTEGER,
    
    -- Paid class fields
    wants_paid_class BOOLEAN DEFAULT false,
    paid_class_details TEXT, -- JSON string
    
    -- Metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'waitlist')),
    understands_commitment BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.users(id),
    review_notes TEXT,
    
    -- Constraints
    CONSTRAINT muallimah_akads_unique_user_batch UNIQUE(user_id, batch_id)
);

-- Enable RLS
ALTER TABLE muallimah_akads ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can view own muallimah akads') THEN
        CREATE POLICY "Users can view own muallimah akads" ON muallimah_akads FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can insert own muallimah akads') THEN
        CREATE POLICY "Users can insert own muallimah akads" ON muallimah_akads FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Users can update own pending muallimah akads') THEN
        CREATE POLICY "Users can update own pending muallimah akads" ON muallimah_akads FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'review'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muallimah_akads' AND policyname = 'Admins can manage muallimah akads') THEN
        CREATE POLICY "Admins can manage muallimah akads" ON muallimah_akads FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles)));
    END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_user_id ON muallimah_akads(user_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_batch_id ON muallimah_akads(batch_id);
CREATE INDEX IF NOT EXISTS idx_muallimah_akads_status ON muallimah_akads(status);

-- Make batch_id nullable in muallimah_registrations
ALTER TABLE muallimah_registrations ALTER COLUMN batch_id DROP NOT NULL;
