-- Add transfer_schedule_end_date to batches
ALTER TABLE batches ADD COLUMN IF NOT EXISTS transfer_schedule_end_date timestamptz;

-- Create transfer_schedule_requests table
CREATE TABLE IF NOT EXISTS transfer_schedule_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    from_halaqah_id UUID REFERENCES halaqahs(id) ON DELETE SET NULL,
    to_halaqah_id UUID NOT NULL REFERENCES halaqahs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transfer_schedule_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own transfer requests"
    ON transfer_schedule_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own requests
CREATE POLICY "Users can insert their own transfer requests"
    ON transfer_schedule_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Admin can do everything on transfer requests
CREATE POLICY "Admin can manage all transfer requests"
    ON transfer_schedule_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'super_admin')
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_transfer_schedule_requests_modtime
    BEFORE UPDATE ON transfer_schedule_requests
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();
