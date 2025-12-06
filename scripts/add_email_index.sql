-- Add index to email column for faster authentication queries
-- This will significantly speed up the login process

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Also add index for role column if not exists
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Composite index for common queries during authentication
CREATE INDEX IF NOT EXISTS idx_users_email_role ON users(email, role);