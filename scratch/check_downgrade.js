const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCandidates() {
  // 1. Get active batch
  const { data: activeBatch } = await supabase
    .from('batches')
    .select('id, name')
    .eq('is_active', true)
    .single();
    
  if (!activeBatch) {
    console.log('No active batch found.');
    return;
  }
  
  console.log(`Checking candidates in active batch: ${activeBatch.name} (${activeBatch.id})`);
  
  // 2. Get configurations to know passing score
  const { data: config } = await supabase
    .from('exam_configurations')
    .select('passing_score')
    .eq('is_active', true)
    .single();
    
  const passingScore = config?.passing_score || 80;

  // 3. Find registrations that are NOT 30A and have NOT passed the exam
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select(`
      id, 
      user_id, 
      chosen_juz, 
      exam_score, 
      exam_status,
      daftar_ulang_submissions(id, confirmed_chosen_juz)
    `)
    .eq('batch_id', activeBatch.id)
    .neq('chosen_juz', '30A');
    
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  // Filter for those who haven't passed
  // Passing means exam_score >= passingScore
  // If exam_score is null, they haven't taken it. If exam_score < passingScore, they failed.
  const toDowngrade = regs.filter(r => {
    return r.exam_score === null || r.exam_score < passingScore;
  });
  
  console.log(`Found ${toDowngrade.length} thalibah who haven't passed their target juz exam and should be downgraded to 30A.`);
  
  if (toDowngrade.length > 0) {
    console.log('Sample:', JSON.stringify(toDowngrade.slice(0, 3), null, 2));
  }
}

checkCandidates();
