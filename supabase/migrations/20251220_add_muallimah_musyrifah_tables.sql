-- Migration for Muallimah and Musyrifah Registration Tables
-- Created: 2025-12-20

-- Create muallimah_registrations table
CREATE TABLE IF NOT EXISTS muallimah_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

    -- Personal Information
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    birth_place TEXT NOT NULL,
    address TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    education TEXT NOT NULL,
    occupation TEXT NOT NULL,

    -- Quran Information
    memorization_level TEXT NOT NULL,
    memorized_juz TEXT,
    preferred_juz TEXT NOT NULL,

    -- Teaching Experience
    teaching_experience TEXT NOT NULL,
    teaching_years TEXT,
    teaching_institutions TEXT,

    -- Schedule Preference
    preferred_schedule TEXT NOT NULL,
    backup_schedule TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'WIB',

    -- Additional Information
    motivation TEXT,
    special_skills TEXT,
    health_condition TEXT,

    -- Metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'waitlist')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,

    -- Constraints
    CONSTRAINT muallimah_registrations_unique_user_batch UNIQUE(user_id, batch_id)
);

-- Create musyrifah_registrations table
CREATE TABLE IF NOT EXISTS musyrifah_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,

    -- Personal Information
    full_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    birth_place TEXT NOT NULL,
    address TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT NOT NULL,
    education TEXT NOT NULL,
    occupation TEXT NOT NULL,

    -- Leadership Experience
    leadership_experience TEXT NOT NULL,
    leadership_years TEXT,
    leadership_roles TEXT,

    -- Management Skills
    management_skills TEXT[] DEFAULT '{}',
    team_management_experience TEXT NOT NULL,

    -- Schedule Preference
    preferred_schedule TEXT NOT NULL,
    backup_schedule TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'WIB',

    -- Additional Information
    motivation TEXT,
    leadership_philosophy TEXT,
    special_achievements TEXT,

    -- Metadata
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'review', 'approved', 'rejected', 'waitlist')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,

    -- Constraints
    CONSTRAINT musyrifah_registrations_unique_user_batch UNIQUE(user_id, batch_id)
);

-- Create indexes for better performance
CREATE INDEX idx_muallimah_registrations_user_id ON muallimah_registrations(user_id);
CREATE INDEX idx_muallimah_registrations_batch_id ON muallimah_registrations(batch_id);
CREATE INDEX idx_muallimah_registrations_status ON muallimah_registrations(status);
CREATE INDEX idx_muallimah_registrations_preferred_juz ON muallimah_registrations(preferred_juz);
CREATE INDEX idx_muallimah_registrations_preferred_schedule ON muallimah_registrations(preferred_schedule);

CREATE INDEX idx_musyrifah_registrations_user_id ON musyrifah_registrations(user_id);
CREATE INDEX idx_musyrifah_registrations_batch_id ON musyrifah_registrations(batch_id);
CREATE INDEX idx_musyrifah_registrations_status ON musyrifah_registrations(status);
CREATE INDEX idx_musyrifah_registrations_leadership_experience ON musyrifah_registrations(leadership_experience);
CREATE INDEX idx_musyrifah_registrations_preferred_schedule ON musyrifah_registrations(preferred_schedule);
CREATE INDEX idx_musyrifah_registrations_management_skills ON musyrifah_registrations USING GIN(management_skills);

-- Grant permissions
GRANT ALL ON muallimah_registrations TO service_role;
GRANT ALL ON muallimah_registrations TO authenticated;
GRANT SELECT ON muallimah_registrations TO anon;

GRANT ALL ON musyrifah_registrations TO service_role;
GRANT ALL ON musyrifah_registrations TO authenticated;
GRANT SELECT ON musyrifah_registrations TO anon;

-- Enable Row Level Security
ALTER TABLE muallimah_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE musyrifah_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for muallimah_registrations
CREATE POLICY "Users can view own muallimah registration" ON muallimah_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own muallimah registration" ON muallimah_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own muallimah registration" ON muallimah_registrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage muallimah registrations" ON muallimah_registrations
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create RLS policies for musyrifah_registrations
CREATE POLICY "Users can view own musyrifah registration" ON musyrifah_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own musyrifah registration" ON musyrifah_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own musyrifah registration" ON musyrifah_registrations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage musyrifah registrations" ON musyrifah_registrations
    FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reviewed_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_muallimah_registrations_reviewed_at
    BEFORE UPDATE ON muallimah_registrations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_musyrifah_registrations_reviewed_at
    BEFORE UPDATE ON musyrifah_registrations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_updated_at_column();