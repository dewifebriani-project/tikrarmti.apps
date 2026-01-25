-- ============================================================================
-- Quick check: Vivin's pendaftaran data
-- ============================================================================

-- 1. Check user
SELECT '=== USER ===' as section, id, email, full_name FROM users WHERE email ILIKE '%vivin%';

-- 2. Check pendaftaran
SELECT '=== PENDAFTARAN ===' as section, id, user_id, email, full_name, status, selection_status, batch_id
FROM pendaftaran_tikrar_tahfidz
WHERE email ILIKE '%vivin%' OR full_name ILIKE '%vivin%';

-- 3. Check batch status for Vivin's registration
SELECT '=== BATCH ===' as section, b.id, b.name, b.status
FROM batches b
WHERE b.id IN (SELECT batch_id FROM pendaftaran_tikrar_tahfidz WHERE email ILIKE '%vivin%');
