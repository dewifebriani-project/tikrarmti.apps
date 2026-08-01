import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We simulate the api route logic
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function simulate() {
  const halaqahId = 'ae22577e-d0b4-46f3-8455-250e54cbe57c';
  
  // 1. fetch students
  const { data: students, error: studentsError } = await supabaseAdmin
      .from('halaqah_students')
      .select('*')
      .eq('halaqah_id', halaqahId)
      
  console.log('Students:', students?.length);

  // 2. fetch submissions
  const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('daftar_ulang_submissions')
      .select('*')
      .or(`ujian_halaqah_id.eq.${halaqahId},tashih_halaqah_id.eq.${halaqahId}`)
      
  console.log('Submissions:', submissions?.length);
  
  // 3. fetch users
  const userIds = [
      ...(students?.map(s => s.thalibah_id) || []),
      ...(submissions?.map(s => s.user_id) || [])
  ].filter(Boolean)
  
  console.log('userIds length:', userIds.length);
  
  const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds)
      
  console.log('usersData length:', usersData?.length);
  console.log('usersError:', usersError);
}
simulate();
