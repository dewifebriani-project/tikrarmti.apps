-- =====================================================
-- SQL Schema Update for Username/Password Authentication
-- =====================================================
-- This file contains the updated schema reflecting the changes
-- from Google OAuth to email/password authentication

-- =====================================================
-- 1. USERS TABLE - Updated with authentication fields
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,  -- Used as username
    password_hash VARCHAR(255) NOT NULL DEFAULT 'managed_by_auth_system', -- For legacy compatibility, actual passwords stored in Supabase Auth
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'calon_thalibah' CHECK (role IN ('calon_thalibah', 'thalibah', 'musyrifah', 'muallimah', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Profile Information
    negara VARCHAR(100),
    provinsi VARCHAR(100),
    kota VARCHAR(100),
    alamat TEXT,
    whatsapp VARCHAR(20),
    telegram VARCHAR(20),
    zona_waktu VARCHAR(50) DEFAULT 'WIB',
    tanggal_lahir DATE,
    tempat_lahir VARCHAR(100),
    jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('L', 'P', 'laki-laki', 'perempuan')),
    pekerjaan VARCHAR(100),
    alasan_daftar TEXT
);

-- =====================================================
-- 2. PENDAFTARAN_TIKRAR_TAHFIDZ TABLE - Updated with email field
-- =====================================================
CREATE TABLE IF NOT EXISTS pendaftaran_tikrar_tahfidz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,

    -- User Information
    email VARCHAR(255) NOT NULL,  -- Added email for identification
    full_name VARCHAR(255) NOT NULL,
    address TEXT,
    wa_phone VARCHAR(20),  -- WhatsApp phone number
    telegram_phone VARCHAR(20),  -- Telegram phone number
    birth_date DATE,
    age INTEGER,  -- Calculated from birth_date
    domicile VARCHAR(255),  -- City, Province
    timezone VARCHAR(50) DEFAULT 'WIB',

    -- Section 1 - Commitment
    understands_commitment BOOLEAN NOT NULL DEFAULT false,
    tried_simulation BOOLEAN NOT NULL DEFAULT false,
    no_negotiation BOOLEAN NOT NULL DEFAULT false,
    has_telegram BOOLEAN NOT NULL DEFAULT false,
    saved_contact BOOLEAN NOT NULL DEFAULT false,

    -- Section 2 - Permission & Program Choice
    has_permission VARCHAR(10) CHECK (has_permission IN ('yes', 'janda', '')),
    permission_name VARCHAR(255),
    permission_phone VARCHAR(20),
    chosen_juz VARCHAR(10) NOT NULL,
    no_travel_plans BOOLEAN NOT NULL DEFAULT false,
    motivation TEXT,
    ready_for_team VARCHAR(20) CHECK (ready_for_team IN ('ready', 'not_ready', 'considering')),

    -- Section 3 - Time Slots
    main_time_slot VARCHAR(20) NOT NULL,
    backup_time_slot VARCHAR(20) NOT NULL,
    time_commitment BOOLEAN NOT NULL DEFAULT false,

    -- Section 4 - Program Understanding
    understands_program BOOLEAN NOT NULL DEFAULT false,
    questions TEXT,

    -- Batch Information
    batch_name VARCHAR(100) NOT NULL,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    selection_status VARCHAR(20) DEFAULT 'pending' CHECK (selection_status IN ('pending', 'selected', 'not_selected', 'waitlist')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES for better performance
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Pendaftaran table indexes
CREATE INDEX IF NOT EXISTS idx_pendaftaran_user_id ON pendaftaran_tikrar_tahfidz(user_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_batch_id ON pendaftaran_tikrar_tahfidz(batch_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_email ON pendaftaran_tikrar_tahfidz(email);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran_tikrar_tahfidz(status);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_submission_date ON pendaftaran_tikrar_tahfidz(submission_date);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_chosen_juz ON pendaftaran_tikrar_tahfidz(chosen_juz);

-- =====================================================
-- 4. VIEWS for common queries
-- =====================================================

-- View for user registrations with complete information
CREATE OR REPLACE VIEW user_registrations AS
SELECT
    p.*,
    u.email as user_email,
    u.full_name as user_full_name,
    u.role as user_role,
    u.whatsapp as user_whatsapp,
    u.telegram as user_telegram,
    u.alamat as user_alamat,
    u.kota as user_kota,
    u.provinsi as user_provinsi,
    u.tanggal_lahir as user_tanggal_lahir,
    -- Use batch_name from pendaftaran table instead
    -- Note: batch details would need to be joined from batches/programs tables if they exist
    pr.name as program_name
FROM pendaftaran_tikrar_tahfidz p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN programs pr ON p.program_id = pr.id;

-- View for active users with complete profiles
CREATE OR REPLACE VIEW active_users_complete AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.role,
    u.negara,
    u.provinsi,
    u.kota,
    u.alamat,
    u.whatsapp,
    u.telegram,
    u.zona_waktu,
    u.tanggal_lahir,
    u.tempat_lahir,
    u.jenis_kelamin,
    u.pekerjaan,
    u.is_active,
    u.created_at,
    u.updated_at,
    -- Count of registrations
    (SELECT COUNT(*) FROM pendaftaran_tikrar_tahfidz WHERE user_id = u.id) as registration_count
FROM users u
WHERE u.is_active = true;

-- =====================================================
-- 5. TRIGGERS for auto-updating timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
-- Note: PostgreSQL doesn't support IF NOT EXISTS for triggers, so we need to drop first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pendaftaran_updated_at ON pendaftaran_tikrar_tahfidz;
CREATE TRIGGER update_pendaftaran_updated_at BEFORE UPDATE ON pendaftaran_tikrar_tahfidz
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. SAMPLE INSERTS (for testing)
-- =====================================================

-- Sample admin user (password: Admin123!)
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_at,
    negara,
    provinsi,
    kota,
    alamat,
    whatsapp,
    telegram,
    zona_waktu,
    tanggal_lahir,
    tempat_lahir,
    jenis_kelamin,
    pekerjaan,
    alasan_daftar
) VALUES (
    gen_random_uuid(),
    'admin@markaztikrar.id',
    'managed_by_auth_system',
    'Admin Tikrar MTI',
    'admin',
    true,
    NOW(),
    'Indonesia',
    'DKI Jakarta',
    'Jakarta',
    'Alamat Admin',
    '+6281234567890',
    '+6281234567890',
    'WIB',
    '1990-01-01',
    'Jakarta',
    'laki-laki',
    'Admin Sistem',
    'Admin Tikrar MTI Apps'
) ON CONFLICT (email) DO NOTHING;

-- Note: Password for admin@markaztikrar.id is "Admin123!"
-- This password should be set manually in Supabase Auth dashboard

-- =====================================================
-- 7. MIGRATION NOTES
-- =====================================================
--
-- For existing data migration from Google OAuth:
--
-- 1. Users table:
--    - The 'email' field is now the primary identifier (used as username)
--    - The 'password_hash' field defaults to 'managed_by_auth_system' for OAuth users
--    - Email/password users will have their passwords stored in Supabase Auth
--
-- 2. Pendaftaran table:
--    - Added 'email' field to directly identify users without requiring JOIN
--    - Personal data fields (birth_date, age, etc.) are now properly populated
--    - Maintains backward compatibility with existing data
--
-- 3. Authentication flow:
--    - Email = Username for login
--    - Passwords are managed by Supabase Auth system
--    - All form submissions now include user's email for identification
--
-- =====================================================