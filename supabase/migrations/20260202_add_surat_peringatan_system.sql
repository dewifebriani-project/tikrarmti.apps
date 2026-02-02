-- Migration for Surat Peringatan (SP) System
-- Created: 2026-02-02
-- Purpose: Track warning letters (SP1, SP2, SP3) for thalibah who don't submit weekly jurnal

-- =====================================================
-- Table: surat_peringatan (SP Records)
-- =====================================================
CREATE TABLE IF NOT EXISTS surat_peringatan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thalibah_id UUID NOT NULL,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

    -- SP Information
    week_number INTEGER NOT NULL, -- Pekan ke-
    sp_level INTEGER NOT NULL CHECK (sp_level IN (1, 2, 3)), -- 1 = SP1, 2 = SP2, 3 = SP3
    sp_type TEXT CHECK (sp_type IN ('permanent_do', 'temporary_do')), -- Untuk SP3 only
    reason TEXT NOT NULL, -- Alasan: 'tidak_lapor_jurnal', 'laporan_tidak_lengkap', 'lainnya'
    udzur_type TEXT CHECK (udzur_type IN ('sakit', 'merawat_orang_tua', 'lainnya')), -- Untuk temporary_do
    udzur_notes TEXT, -- Keterangan udzur

    -- Status
    is_blacklisted BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),

    -- Metadata
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    issued_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT sp_unique_thalibah_week UNIQUE(thalibah_id, batch_id, week_number, sp_level),

    -- Foreign key constraints to users table
    CONSTRAINT sp_thalibah_fkey FOREIGN KEY (thalibah_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT sp_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES users(id),
    CONSTRAINT sp_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sp_thalibah_id ON surat_peringatan(thalibah_id);
CREATE INDEX IF NOT EXISTS idx_sp_batch_id ON surat_peringatan(batch_id);
CREATE INDEX IF NOT EXISTS idx_sp_week_number ON surat_peringatan(week_number);
CREATE INDEX IF NOT EXISTS idx_sp_level ON surat_peringatan(sp_level);
CREATE INDEX IF NOT EXISTS idx_sp_status ON surat_peringatan(status);
CREATE INDEX IF NOT EXISTS idx_sp_issued_at ON surat_peringatan(issued_at);

-- =====================================================
-- Table: sp_history (History DO/Blacklist)
-- =====================================================
CREATE TABLE IF NOT EXISTS sp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thalibah_id UUID NOT NULL,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

    -- Final Action
    final_action TEXT NOT NULL CHECK (final_action IN ('permanent_do', 'temporary_do', 'blacklisted')),
    total_sp_count INTEGER NOT NULL DEFAULT 3, -- Total SP yang diterima sebelum final action
    udzur_type TEXT CHECK (udzur_type IN ('sakit', 'merawat_orang_tua', 'lainnya')),
    udzur_notes TEXT,
    temporary_until TIMESTAMP WITH TIME ZONE, -- Untuk temporary DO, tanggal bisa kembali

    -- Metadata
    action_taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_taken_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Foreign key constraints to users table
    CONSTRAINT sp_history_thalibah_fkey FOREIGN KEY (thalibah_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT sp_history_action_taken_by_fkey FOREIGN KEY (action_taken_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sp_history_thalibah_id ON sp_history(thalibah_id);
CREATE INDEX IF NOT EXISTS idx_sp_history_batch_id ON sp_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_sp_history_final_action ON sp_history(final_action);
CREATE INDEX IF NOT EXISTS idx_sp_history_action_taken_at ON sp_history(action_taken_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE surat_peringatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Musyrifah and Admin can view all SP" ON surat_peringatan;
DROP POLICY IF EXISTS "Thalibah can view own SP" ON surat_peringatan;
DROP POLICY IF EXISTS "Musyrifah and Admin can insert SP" ON surat_peringatan;
DROP POLICY IF EXISTS "Musyrifah and Admin can update SP" ON surat_peringatan;
DROP POLICY IF EXISTS "Musyrifah and Admin can delete SP" ON surat_peringatan;

DROP POLICY IF EXISTS "Musyrifah and Admin can view SP history" ON sp_history;

-- =====================================================
-- RLS Policies for surat_peringatan
-- =====================================================

-- Helper function to check if user has musyrifah or admin role
CREATE OR REPLACE FUNCTION has_musyrifah_or_admin_role(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = user_id
        AND ('musyrifah' = ANY(roles) OR 'admin' = ANY(roles))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Musyrifah & Admin can view all SP
CREATE POLICY "Musyrifah and Admin can view all SP" ON surat_peringatan
    FOR SELECT USING (has_musyrifah_or_admin_role(auth.uid()));

-- Thalibah can view own SP
CREATE POLICY "Thalibah can view own SP" ON surat_peringatan
    FOR SELECT USING (auth.uid() = thalibah_id);

-- Musyrifah & Admin can insert SP
CREATE POLICY "Musyrifah and Admin can insert SP" ON surat_peringatan
    FOR INSERT WITH CHECK (has_musyrifah_or_admin_role(auth.uid()));

-- Musyrifah & Admin can update SP
CREATE POLICY "Musyrifah and Admin can update SP" ON surat_peringatan
    FOR UPDATE USING (has_musyrifah_or_admin_role(auth.uid()));

-- Musyrifah & Admin can delete SP
CREATE POLICY "Musyrifah and Admin can delete SP" ON surat_peringatan
    FOR DELETE USING (has_musyrifah_or_admin_role(auth.uid()));

-- =====================================================
-- RLS Policies for sp_history
-- =====================================================

-- Musyrifah & Admin can view all history
CREATE POLICY "Musyrifah and Admin can view SP history" ON sp_history
    FOR SELECT USING (has_musyrifah_or_admin_role(auth.uid()));

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get current active SP count for a thalibah
CREATE OR REPLACE FUNCTION get_active_sp_count(p_thalibah_id UUID, p_batch_id UUID)
RETURNS INTEGER AS $$
DECLARE
    sp_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sp_count
    FROM surat_peringatan
    WHERE thalibah_id = p_thalibah_id
    AND batch_id = p_batch_id
    AND status = 'active';

    RETURN COALESCE(sp_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get latest SP level for a thalibah
CREATE OR REPLACE FUNCTION get_latest_sp_level(p_thalibah_id UUID, p_batch_id UUID)
RETURNS INTEGER AS $$
DECLARE
    latest_level INTEGER;
BEGIN
    SELECT COALESCE(MAX(sp_level), 0) INTO latest_level
    FROM surat_peringatan
    WHERE thalibah_id = p_thalibah_id
    AND batch_id = p_batch_id
    AND status = 'active';

    RETURN latest_level;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate next SP level
CREATE OR REPLACE FUNCTION calculate_next_sp_level(p_thalibah_id UUID, p_batch_id UUID)
RETURNS INTEGER AS $$
DECLARE
    latest_level INTEGER;
BEGIN
    latest_level := get_latest_sp_level(p_thalibah_id, p_batch_id);

    -- If no active SP, start with SP1
    IF latest_level = 0 THEN
        RETURN 1;
    -- If latest is SP1 or SP2, increment
    ELSIF latest_level < 3 THEN
        RETURN latest_level + 1;
    -- If already SP3, stay at SP3 (should not happen normally)
    ELSE
        RETURN 3;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sp_updated_at
    BEFORE UPDATE ON surat_peringatan
    FOR EACH ROW
    EXECUTE FUNCTION update_sp_updated_at();

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Allow service role full access
GRANT ALL ON surat_peringatan TO service_role;
GRANT ALL ON sp_history TO service_role;

-- Allow authenticated users to read (via RLS policies)
GRANT SELECT ON surat_peringatan TO authenticated;
GRANT SELECT ON sp_history TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE surat_peringatan IS 'Surat Peringatan (SP) records for thalibah who dont submit weekly jurnal';
COMMENT ON COLUMN surat_peringatan.week_number IS 'Week number (pekan) in the batch';
COMMENT ON COLUMN surat_peringatan.sp_level IS 'SP level: 1 = SP1, 2 = SP2, 3 = SP3 (Drop Out)';
COMMENT ON COLUMN surat_peringatan.sp_type IS 'For SP3: permanent_do or temporary_do';
COMMENT ON COLUMN surat_peringatan.reason IS 'Reason for SP: tidak_lapor_jurnal, laporan_tidak_lengkap, lainnya';
COMMENT ON COLUMN surat_peringatan.udzur_type IS 'For temporary_do: sakit, merawat_orang_tua, lainnya';
COMMENT ON COLUMN surat_peringatan.is_blacklisted IS 'True if thalibah is blacklisted from program';
COMMENT ON COLUMN surat_peringatan.status IS 'Status: active, cancelled, expired';

COMMENT ON TABLE sp_history IS 'History of thalibah who reached SP3 (DO/Blacklist)';
COMMENT ON COLUMN sp_history.final_action IS 'Final action taken: permanent_do, temporary_do, blacklisted';
COMMENT ON COLUMN sp_history.temporary_until IS 'For temporary_do: date when thalibah can rejoin';
