-- ============================================================================
-- Add Blacklist Feature to Users Table
-- ============================================================================
-- Purpose: Add blacklist functionality to prevent duplicate/problematic users from registering
-- Created: 2025-03-25
-- ============================================================================

-- Add blacklist columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
ADD COLUMN IF NOT EXISTS blacklisted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blacklist_notes TEXT,
ADD COLUMN IF NOT EXISTS blacklist_by UUID REFERENCES auth.users(id);

-- Add index for better performance on blacklist queries
CREATE INDEX IF NOT EXISTS idx_users_is_blacklisted ON users(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment for documentation
COMMENT ON COLUMN users.is_blacklisted IS 'Indicates if the user is blacklisted from registering';
COMMENT ON COLUMN users.blacklist_reason IS 'Reason for blacklisting the user';
COMMENT ON COLUMN users.blacklisted_at IS 'Timestamp when user was blacklisted';
COMMENT ON COLUMN users.blacklist_notes IS 'Additional notes about blacklisting';
COMMENT ON COLUMN users.blacklist_by IS 'Admin who blacklisted the user';

-- ============================================================================
-- Create blacklist audit logs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS blacklist_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('blacklist', 'whitelist', 'remove_blacklist')),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Grant permissions
GRANT ALL ON blacklist_audit_logs TO service_role;
GRANT SELECT, INSERT ON blacklist_audit_logs TO authenticated;

-- Enable RLS
ALTER TABLE blacklist_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit logs
CREATE POLICY "Admins can view all blacklist audit logs"
ON blacklist_audit_logs
FOR SELECT
TO authenticated
USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can insert blacklist audit logs"
ON blacklist_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Service role can manage blacklist audit logs"
ON blacklist_audit_logs
FOR ALL
TO service_role
WITH CHECK (true);

-- ============================================================================
-- Function to check if phone or email is blacklisted
-- ============================================================================
CREATE OR REPLACE FUNCTION is_phone_or_email_blacklisted(check_phone TEXT, check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE (whatsapp = check_phone OR email = check_email)
    AND is_blacklisted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_phone_or_email_blacklisted TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('is_blacklisted', 'blacklist_reason', 'blacklisted_at', 'blacklist_notes', 'blacklist_by')
ORDER BY column_name;
