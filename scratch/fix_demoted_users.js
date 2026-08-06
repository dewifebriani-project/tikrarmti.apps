const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixDemotedUsers() {
  // Find users who have exam_status = completed and exam_score < 80
  const { data: regs } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, full_name, chosen_juz, exam_status, exam_score')
    .eq('exam_status', 'completed')
    .lt('exam_score', 80);

  console.log(`Found ${regs?.length || 0} users who failed but have 'completed' status.`);
  
  if (!regs) return;

  for (const reg of regs) {
    // How many attempts do they actually have?
    const { data: attempts } = await supabaseAdmin
      .from('exam_attempts')
      .select('id, status, juz_number')
      .eq('registration_id', reg.id)
      .eq('status', 'submitted');
      
    if (attempts && attempts.length > 0 && attempts.length < 3) {
      console.log(`User: ${reg.full_name}, Current Juz: ${reg.chosen_juz}, Score: ${reg.exam_score}, Attempts: ${attempts.length}`);
      
      // Revert them to not_started
      // Wait, what was their original juz? We can look at the attempt juz!
      // If attempt juz_number is 30, they should be in 1A or 29A etc.
      // But we can't easily guess if they were 1A or 29A without looking at history.
      // Let's just set exam_status to 'not_started' so they can retry. 
      // AND we need to fix their chosen_juz if it was demoted.
    }
  }
}
fixDemotedUsers();
