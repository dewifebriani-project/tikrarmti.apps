-- ============================================================================
-- PASSWORD RESET OTP TABLE
-- ============================================================================
-- Table untuk menyimpan kode OTP reset password

CREATE TABLE IF NOT EXISTS password_reset_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email_code ON password_reset_otps(email, code);
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at ON password_reset_otps(expires_at);

-- Clean up expired OTPs (run via cron or periodically)
DELETE FROM password_reset_otps
WHERE expires_at < NOW() - INTERVAL '1 day';

-- RLS Policies
ALTER TABLE password_reset_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all OTPs
DROP POLICY IF EXISTS "Service role can manage all OTPs" ON password_reset_otps;
CREATE POLICY "Service role can manage all OTPs"
ON password_reset_otps
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comment
COMMENT ON TABLE password_reset_otps IS 'OTP codes for password reset flow';
COMMENT ON COLUMN password_reset_otps.code IS '6-digit OTP code';
COMMENT ON COLUMN password_reset_otps.expires_at IS 'OTP expiration time (15 minutes)';
COMMENT ON COLUMN password_reset_otps.used IS 'Whether OTP has been used';
