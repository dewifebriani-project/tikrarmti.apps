require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Add meeting_id and passcode to batch_zoom_links
  const { error: err1 } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE public.batch_zoom_links
      ADD COLUMN IF NOT EXISTS meeting_id TEXT,
      ADD COLUMN IF NOT EXISTS passcode TEXT;
    `
  });
  
  if (err1) {
    // Try direct approach - just insert and see what happens
    console.log('RPC approach failed, trying direct column check...');
    
    // Test if columns exist by selecting them
    const { data: test, error: testErr } = await supabase
      .from('batch_zoom_links')
      .select('meeting_id, passcode')
      .limit(1);
    
    if (testErr && testErr.message.includes('does not exist')) {
      console.error('Columns do not exist. Please run the following SQL in Supabase SQL Editor:');
      console.log(`
ALTER TABLE public.batch_zoom_links
ADD COLUMN IF NOT EXISTS meeting_id TEXT,
ADD COLUMN IF NOT EXISTS passcode TEXT;

ALTER TABLE public.halaqah
ADD COLUMN IF NOT EXISTS zoom_link_id UUID REFERENCES public.batch_zoom_links(id) ON DELETE SET NULL;
      `);
    } else if (!testErr) {
      console.log('batch_zoom_links already has meeting_id and passcode columns ✓');
    } else {
      console.error('Unexpected error:', testErr);
    }
  } else {
    console.log('Added meeting_id and passcode to batch_zoom_links ✓');
  }

  // 2. Check if zoom_link_id exists on halaqah
  const { data: test2, error: testErr2 } = await supabase
    .from('halaqah')
    .select('zoom_link_id')
    .limit(1);
  
  if (testErr2 && testErr2.message.includes('does not exist')) {
    console.error('zoom_link_id column does not exist on halaqah. Please run the SQL above in Supabase SQL Editor.');
  } else if (!testErr2) {
    console.log('halaqah already has zoom_link_id column ✓');
  } else {
    console.error('Unexpected error:', testErr2);
  }
}

run();
