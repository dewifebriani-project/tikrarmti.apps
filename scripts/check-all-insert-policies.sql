-- ============================================================================
-- Debug: Check ALL INSERT policies on daftar_ulang_submissions
-- This will show if there are restrictive policies blocking regular users
-- ============================================================================

-- 1. Show ALL INSERT policies with detailed info
SELECT
  '=== ALL INSERT POLICIES ===' as section,
  policyname,
  permissive,
  roles,
  pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expression
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

-- 3. Check what happens with a regular INSERT simulation
-- This shows what the policy actually checks
WITH sample_data AS (
  SELECT
    '00000000-0000-0000-0000-000000000001'::uuid as test_user_id,
    '00000000-0000-0000-0000-000000000001'::uuid as test_registration_id
)
SELECT
  '=== POLICY EVALUATION SIMULATION ===' as section,
  policyname,
  permissive,
  with_check_expression,
  -- Evaluate what the policy checks
  CASE
    WHEN with_check_expression LIKE '%auth.uid()%' THEN 'Checks auth.uid()'
    WHEN with_check_expression LIKE '%role = %admin%' THEN 'Admin role check'
    WHEN with_check_expression LIKE '%EXISTS%' THEN 'Subquery check'
    ELSE 'Other check'
  END as check_type
FROM pg_policies,
  LATERAL pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expression
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT';

-- 4. Check if the admin policy is blocking regular users
-- Admin policies should have: EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
-- If this is the ONLY policy or if it's restrictive, it will block regular users
SELECT
  '=== ADMIN POLICY CHECK ===' as section,
  policyname,
  permissive,
  CASE
    WHEN pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%admin%' THEN 'ADMIN POLICY DETECTED'
    ELSE 'Regular user policy'
  END as policy_type,
  pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) as with_check_expression
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT';

-- 5. Summary: What policies exist and which ones apply to regular users
SELECT
  '=== POLICY SUMMARY ===' as section,
  policyname,
  CASE
    WHEN pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%auth.uid()%' AND NOT pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%admin%' THEN 'Regular user policy (user_id = auth.uid())'
    WHEN pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%admin%' THEN 'Admin policy (requires admin role)'
    ELSE 'Other policy'
  END as policy_applies_to,
  permissive as is_permissive,
  CASE
    WHEN permissive THEN 'Need at least one matching policy'
    ELSE 'Need ALL policies to match'
  END as evaluation_rule
FROM pg_policies
WHERE tablename = 'daftar_ulang_submissions'
  AND cmd = 'INSERT'
ORDER BY
  CASE
    WHEN pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%admin%' THEN 1
    ELSE 0
  END,
  policyname;

-- 6. Check RLS status
SELECT
  '=== RLS CONFIGURATION ===' as section,
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'daftar_ulang_submissions';

-- 7. RECOMMENDATION
DO $$
DECLARE
  v_has_user_policy boolean := FALSE;
  v_has_admin_policy boolean := FALSE;
  v_has_restrictive boolean := FALSE;
BEGIN
  -- Check for regular user policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%user_id = auth.uid()%'
      AND pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) NOT LIKE '%admin%'
  ) INTO v_has_user_policy;

  -- Check for admin policy
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daftar_ulang_submissions'
      AND cmd = 'INSERT'
      AND pg_get_expr(with_check, 'daftar_ulang_submissions'::regclass) LIKE '%admin%'
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
  RAISE NOTICE 'Has regular user policy (user_id = auth.uid()): %', v_has_user_policy;
  RAISE NOTICE 'Has admin policy: %', v_has_admin_policy;
  RAISE NOTICE 'Has restrictive policies: %', v_has_restrictive;
  RAISE NOTICE '';

  IF v_has_restrictive THEN
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
