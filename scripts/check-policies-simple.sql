-- ============================================================================
-- Debug: Check ALL INSERT policies on daftar_ulang_submissions
-- Simple version without pg_get_expr complications
-- ============================================================================

-- 1. Show ALL INSERT policies - RAW data
SELECT
  '=== 1. ALL INSERT POLICIES (RAW) ===' as section,
  policyname,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. Count and classify policies
SELECT
  '=== 2. POLICY COUNT & TYPE ===' as section,
  COUNT(*) as total_insert_policies,
  SUM(CASE WHEN permissive THEN 1 ELSE 0 END) as permissive_policies,
  SUM(CASE WHEN NOT permissive THEN 1 ELSE 0 END) as restrictive_policies,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as all_policy_names,
  CASE
    WHEN BOOL_AND(permissive) THEN 'All PERMISSIVE (need at least one to pass)'
    ELSE 'Has RESTRICTIVE (need ALL to pass)'
  END as evaluation_mode
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT';

-- 3. Classify each policy by type
SELECT
  '=== 3. POLICY CLASSIFICATION ===' as section,
  policyname,
  permissive,
  CASE
    WHEN with_check LIKE '%admin%' THEN 'ADMIN policy'
    WHEN with_check LIKE '%user_id = auth.uid()%' THEN 'REGULAR USER policy'
    WHEN with_check LIKE '%auth.uid()%' THEN 'USER-related policy'
    ELSE 'OTHER policy'
  END as policy_type,
  CASE
    WHEN permissive THEN 'At least one must pass'
    ELSE 'All must pass'
  END as rule,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 4. Check if there's a policy for regular users
SELECT
  '=== 4. REGULAR USER POLICY CHECK ===' as section,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'daftar_ulang_submissions'
        AND cmd = 'INSERT'
        AND with_check LIKE '%user_id = auth.uid()%'
        AND with_check NOT LIKE '%admin%'
    ) THEN 'YES - Regular user policy exists'
    ELSE 'NO - Regular user policy MISSING!'
  END as has_regular_user_policy;

-- 5. Check if there's an admin policy
SELECT
  '=== 5. ADMIN POLICY CHECK ===' as section,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'daftar_ulang_submissions'
        AND cmd = 'INSERT'
        AND with_check LIKE '%admin%'
    ) THEN 'YES - Admin policy exists'
    ELSE 'NO - Admin policy not found'
  END as has_admin_policy;

-- 6. Final diagnosis
DO $$
DECLARE
  v_total_policies integer;
  v_has_user_policy boolean;
  v_has_admin_policy boolean;
  v_has_restrictive boolean;
BEGIN
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE tablename = 'daftar_ulang_submissions' AND cmd = 'INSERT';

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND with_check LIKE '%user_id = auth.uid()%'
      AND with_check NOT LIKE '%admin%'
  ) INTO v_has_user_policy;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND with_check LIKE '%admin%'
  ) INTO v_has_admin_policy;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND NOT permissive
  ) INTO v_has_restrictive;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           DAFTAR ULANG INSERT POLICY DIAGNOSIS              ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Total INSERT policies: %', v_total_policies;
  RAISE NOTICE 'Has regular user policy: %', v_has_user_policy;
  RAISE NOTICE 'Has admin policy: %', v_has_admin_policy;
  RAISE NOTICE 'Has restrictive policies: %', v_has_restrictive;
  RAISE NOTICE '';

  IF v_total_policies = 0 THEN
    RAISE NOTICE '🔴 CRITICAL: NO INSERT policies at all!';
    RAISE NOTICE '   Nobody can insert into this table.';
  ELSIF v_has_restrictive THEN
    RAISE NOTICE '🔴 ISSUE: RESTRICTIVE policies detected!';
    RAISE NOTICE '   All restrictive policies MUST pass for insert to work.';
    RAISE NOTICE '   This could be blocking regular users.';
  ELSIF NOT v_has_user_policy THEN
    RAISE NOTICE '🔴 ISSUE: No regular user policy!';
    RAISE NOTICE '   Regular users cannot insert.';
    RAISE NOTICE '   Expected: WITH CHECK (user_id = auth.uid())';
  ELSIF v_has_user_policy AND NOT v_has_admin_policy THEN
    RAISE NOTICE '🟢 OK: Regular user policy exists.';
    RAISE NOTICE '   Users should be able to insert.';
  ELSIF v_has_user_policy AND v_has_admin_policy THEN
    RAISE NOTICE '🟢 OK: Both admin and user policies exist.';
    RAISE NOTICE '   Users should be able to insert.';
  END IF;

  RAISE NOTICE '';
END $$;

-- 7. Show RLS status
SELECT
  '=== 7. RLS STATUS ===' as section,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'daftar_ulang_submissions';
