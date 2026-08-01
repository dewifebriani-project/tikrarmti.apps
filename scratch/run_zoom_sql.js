const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '/Users/dewifebrinani/My Projects/tikrarmti.apps/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sql = fs.readFileSync('/Users/dewifebrinani/.gemini/antigravity/brain/efd40131-0c35-43fd-a665-21f49d8bd889/scratch/batch_zoom.sql', 'utf8');
  const { data, error } = await supabase.rpc('admin_exec_sql', { sql_query: sql });
  console.log("Data:", data, "Error:", error);
}
main();
