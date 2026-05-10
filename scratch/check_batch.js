
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActiveBatch() {
  const { data: batch, error } = await supabase
    .from('batches')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching batch:', error);
    return;
  }

  console.log('Active Batch:', JSON.stringify(batch, null, 2));
  
  const now = new Date();
  const startDate = new Date(batch.start_date);
  const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekNum = Math.max(1, Math.floor((Math.max(0, diffDays - 7)) / 7) + 1);
  
  console.log('Current Date:', now.toISOString());
  console.log('Diff Days:', diffDays);
  console.log('Calculated Week Number:', weekNum);
}

checkActiveBatch();
