-- ============================================================================
-- System Logs Table Migration
-- ============================================================================
-- Purpose: Centralized logging for system errors and monitoring
-- Created: 2026-01-06
-- ============================================================================

-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Error identification
  error_message TEXT NOT NULL,
  error_name TEXT,
  error_stack TEXT,

  -- Context
  context JSONB DEFAULT '{}'::jsonb,

  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT[],

  -- Request information
  request_path TEXT,
  request_method TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Error categorization
  severity TEXT DEFAULT 'ERROR' CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  error_type TEXT DEFAULT 'runtime' CHECK (error_type IN ('runtime', 'auth', 'database', 'validation', 'network', 'unknown')),

  -- Special flags for filtering
  is_auth_error BOOLEAN DEFAULT FALSE,
  is_supabase_getuser_error BOOLEAN DEFAULT FALSE,

  -- Additional metadata
  environment TEXT DEFAULT 'development',
  release_version TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Sentry integration
  sentry_event_id TEXT,
  sentry_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_error_type ON system_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_is_auth_error ON system_logs(is_auth_error);
CREATE INDEX IF NOT EXISTS idx_system_logs_is_supabase_getuser_error ON system_logs(is_supabase_getuser_error);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_system_logs_admin_query ON system_logs(created_at DESC, severity, error_type);

-- GIN index for context JSONB queries
CREATE INDEX IF NOT EXISTS idx_system_logs_context_gin ON system_logs USING GIN(context);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all logs
CREATE POLICY "Admins can view all system logs"
ON system_logs
FOR SELECT
TO authenticated
USING (
  -- Check if user has admin role (supports both 'role' and 'roles' column)
  EXISTS (
    SELECT 1
    FROM users
    WHERE users.id = auth.uid()
    AND (
      users.role = 'admin'  -- Single role column (backward compatibility)
      OR 'admin' = ANY(users.roles)  -- Multi-role array (new standard)
    )
  )
);

-- Policy: Service role can insert logs (for server-side logging)
CREATE POLICY "Service role can insert system logs"
ON system_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Service role can update logs (for Sentry sync)
CREATE POLICY "Service role can update system_logs"
ON system_logs
FOR UPDATE
TO service_role
WITH CHECK (true);

-- Policy: Service role can delete logs (for cleanup)
CREATE POLICY "Service role can delete system_logs"
ON system_logs
FOR DELETE
TO service_role
USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to insert error log with automatic categorization
CREATE OR REPLACE FUNCTION log_system_error(
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'ERROR',
  p_error_type TEXT DEFAULT 'runtime',
  p_request_path TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
  v_is_auth_error BOOLEAN := FALSE;
  v_is_supabase_getuser_error BOOLEAN := FALSE;
BEGIN
  -- Auto-detect auth errors
  IF p_error_message ILIKE '%auth%' OR p_error_message ILIKE '%unauthorized%' OR p_error_message ILIKE '%forbidden%' THEN
    v_is_auth_error := TRUE;
  END IF;

  -- Auto-detect supabase.auth.getUser errors
  IF p_error_message ILIKE '%supabase.auth.getUser%' OR
     p_error_message ILIKE '%getUser()%' OR
     p_context ? 'function' AND (p_context->>'function') ILIKE '%getUser%' THEN
    v_is_supabase_getuser_error := TRUE;
    v_is_auth_error := TRUE;
  END IF;

  -- Insert the log
  INSERT INTO system_logs (
    error_message,
    error_stack,
    context,
    user_id,
    severity,
    error_type,
    is_auth_error,
    is_supabase_getuser_error,
    request_path,
    request_method,
    environment,
    release_version
  )
  VALUES (
    p_error_message,
    p_error_stack,
    p_context,
    p_user_id,
    p_severity,
    p_error_type,
    v_is_auth_error,
    v_is_supabase_getuser_error,
    p_request_path,
    p_request_method,
    current_setting('app.environment', TRUE)::TEXT,
    current_setting('app.release_version', TRUE)::TEXT
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute on function to authenticated users
GRANT EXECUTE ON FUNCTION log_system_error TO authenticated;

-- ============================================================================
-- Cleanup Policy (Optional)
-- ============================================================================

-- Function to clean old logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INT;
BEGIN
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND severity IN ('DEBUG', 'INFO', 'WARN'); -- Keep ERROR and FATAL

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Grant execute to service role only
GRANT EXECUTE ON FUNCTION cleanup_old_system_logs TO service_role;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE system_logs IS 'Centralized system error logging for monitoring and debugging';
COMMENT ON COLUMN system_logs.is_supabase_getuser_error IS 'Flag for tracking supabase.auth.getUser() failures specifically';
COMMENT ON COLUMN system_logs.is_auth_error IS 'Flag for tracking authentication-related errors';
COMMENT ON COLUMN system_logs.context IS 'JSONB context with additional debugging information';
COMMENT ON COLUMN system_logs.sentry_event_id IS 'Event ID from Sentry for cross-referencing';
