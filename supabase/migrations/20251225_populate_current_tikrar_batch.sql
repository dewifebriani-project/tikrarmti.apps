-- Migration: Populate current_tikrar_batch_id for existing users
-- Date: 2025-12-25
-- Description: Set current_tikrar_batch_id for users who already have approved registrations

-- Update users with their current tikrar batch based on their latest approved/selected registration
UPDATE public.users u
SET current_tikrar_batch_id = subquery.batch_id,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    batch_id
  FROM public.pendaftaran_tikrar_tahfidz
  WHERE (status = 'approved' OR selection_status = 'selected')
    AND user_id IS NOT NULL
    AND batch_id IS NOT NULL
  ORDER BY user_id, created_at DESC
) AS subquery
WHERE u.id = subquery.user_id
  AND u.current_tikrar_batch_id IS NULL;

-- Show results
SELECT
  u.id,
  u.email,
  u.full_name,
  u.current_tikrar_batch_id,
  b.name as batch_name,
  b.status as batch_status
FROM public.users u
LEFT JOIN public.batches b ON u.current_tikrar_batch_id = b.id
WHERE u.current_tikrar_batch_id IS NOT NULL
ORDER BY u.created_at DESC
LIMIT 20;
