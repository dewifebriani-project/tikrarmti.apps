-- Explicitly allow all authenticated users to read batches
DROP POLICY IF EXISTS "Authenticated users can view batches" ON batches;
CREATE POLICY "Authenticated users can view batches"
ON batches
FOR SELECT
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
