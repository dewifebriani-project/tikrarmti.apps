-- ============================================================================
-- Debug: Check ALL INSERT policies on daftar_ulang_submissions
-- This will show if there are restrictive policies blocking regular users
-- ============================================================================

-- 1. Show ALL INSERT policies with detailed info (raw)
SELECT
  '=== ALL INSERT POLICIES (RAW) ===' as section,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. Check if there are RESTRICTIVE policies
-- If permissive = false, then ALL policies must pass (not just one)
SELECT
  '=== POLICY TYPE ANALYSIS ===' as section,
  CASE
    WHEN COUNT(*) = 0 THEN 'WARNING: NO INSERT policies found! No one can insert.'
    WHEN BOOL_AND(permissive) THEN 'OK: All policies are PERMISSIVE (at least one must pass)'
    ELSE 'CRITICAL: Found RESTRICTIVE policies! ALL must pass.'
  END as policy_analysis,
  COUNT(*) as total_policies,
  SUM(CASE WHEN permissive THEN 1 ELSE 0 END) as permissive_count,
  SUM(CASE WHEN NOT permissive THEN 1 ELSE 0 END) as restrictive_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as all_policy_names
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT';

-- 3. Show policy expressions in readable format
SELECT
  '=== POLICY EXPRESSIONS (DECODED) ===' as section,
  policyname,
  permissive,
  pg_get_expr(qual, c.oid) as using_expression,
  pg_get_expr(with_check, c.oid) as with_check_expression
FROM pg_policies p
JOIN pg_class c ON c.relname = 'daftar_ulang_submissions'
WHERE p.tablename = 'daftar_ulang_submissions'
  AND p.cmd = 'INSERT'
ORDER BY policyname;

-- 4. Check if the admin policy is blocking regular users
SELECT
  '=== POLICY TYPE CLASSIFICATION ===' as section,
  policyname,
  permissive,
  CASE
    WHEN with_check::text LIKE '%admin%' THEN 'Admin policy (requires admin role)'
    WHEN with_check::text LIKE '%auth.uid()%' THEN 'Regular user policy (user_id = auth.uid())'
    ELSE 'Other policy'
  END as policy_type,
  CASE
    WHEN permissive THEN 'Need at least one matching policy'
    ELSE 'Need ALL policies to match'
  END as evaluation_rule
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Check RLS status
SELECT
  '=== RLS CONFIGURATION ===' as section,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'daftar_ulang_submissions';

-- 6. RECOMMENDATION
DO $$
DECLARE
  v_has_user_policy boolean := FALSE;
  v_has_admin_policy boolean := FALSE;
  v_has_restrictive boolean := FALSE;
  v_policy_count integer := 0;
BEGIN
  -- Count INSERT policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'daftar_ulang_submissions'
    AND cmd = 'INSERT';

  -- Check for regular user policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND with_check::text LIKE '%user_id = auth.uid()%'
      AND with_check::text NOT LIKE '%admin%'
  ) INTO v_has_user_policy;

  -- Check for admin policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND with_check::text LIKE '%admin%'
  ) INTO v_has_admin_policy;

  -- Check for restrictive policies
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND NOT permissive
  ) INTO v_has_restrictive;

  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNOSIS RESULTS ===';
  RAISE NOTICE 'Total INSERT policies found: %', v_policy_count;
  RAISE NOTICE 'Has regular user policy (user_id = auth.uid()): %', v_has_user_policy;
  RAISE NOTICE 'Has admin policy: %', v_has_admin_policy;
  RAISE NOTICE 'Has restrictive policies: %', v_has_restrictive;
  RAISE NOTICE '';

  IF v_policy_count = 0 THEN
    RAISE NOTICE 'CRITICAL: NO INSERT policies found! No one can insert.';
  ELSIF v_has_restrictive THEN
    RAISE NOTICE 'ISSUE FOUND: Restrictive policies detected!';
    RAISE NOTICE 'All restrictive policies must pass for INSERT to succeed.';
    RAISE NOTICE 'This could be blocking regular users.';
  ELSIF NOT v_has_user_policy THEN
    RAISE NOTICE 'ISSUE FOUND: No regular user policy found!';
    RAISE NOTICE 'Regular users need a policy like: WITH CHECK (user_id = auth.uid())';
  ELSIF v_has_admin_policy AND v_has_user_policy THEN
    RAISE NOTICE 'OK: Both admin and regular user policies exist.';
    RAISE NOTICE 'Regular users should be able to INSERT.';
  END IF;

  RAISE NOTICE '';
END $$;
