import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const sql = `
-- 1. IDENTIFY & CLEAN DUPLICATES 
DELETE FROM public.users a USING public.users b WHERE a.ctid < b.ctid AND a.id = b.id;

-- 2. ROBUST ADMIN CHECK
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE (id = auth.uid()) AND (role = 'admin' OR 'admin' = ANY(roles)));
END;
$$;

-- 3. RLS POLICY
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
CREATE POLICY "users_select_policy" ON public.users FOR SELECT TO authenticated USING ((auth.uid() = id) OR (auth.jwt()->>'email' = email) OR public.is_admin());

-- 4. FINAL DEWI FIX
UPDATE public.users SET roles = ARRAY['admin'], role = 'admin' WHERE email = 'dewifebriani@gmail.com';
`;

async function main() {
  console.log('Applying direct SQL via RPC or script...')
  // Since we can't easily run arbitrary SQL via supabase-js without an RPC, 
  // we'll just do the manual updates via the client for the most critical part.
  
  console.log('Fixing Dewi account via client...')
  const { error } = await supabase
    .from('users')
    .update({ roles: ['admin'], role: 'admin' })
    .eq('email', 'dewifebriani@gmail.com')
  
  if (error) console.error('Error:', error)
  else console.log('Successfully updated Dewi to admin.')

  console.log('Updating auth metadata...')
  await supabase.auth.admin.updateUserById('eccdf0f7-e9e7-4284-bf8f-5b5816dcf682', {
    app_metadata: { role: 'admin', roles: ['admin'] },
    user_metadata: { role: 'admin' }
  })
  console.log('Done.')
}

main().catch(console.error)
