const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = '079ec4b5-8fad-4fe7-8e0e-7345c9454009'; // Ania
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43';
  
  const { data: pairing } = await supabase
      .from('study_partners')
      .select('*')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId},user_3_id.eq.${userId}`)
      .eq('batch_id', batchId)
      .eq('pairing_status', 'active')
      .maybeSingle()
      
  console.log('Pairing:', pairing);

  const { data: submissionData } = await supabase
      .from('daftar_ulang_submissions')
      .select('id, partner_name, partner_relationship, partner_notes, partner_wa_phone, partner_type, partner_user_id, status')
      .eq('user_id', userId)
      .eq('batch_id', batchId)
      .in('status', ['draft', 'submitted', 'approved'])
      .order('created_at', { ascending: false })
      .maybeSingle()
      
  console.log('SubmissionData:', submissionData);
}
test();
