const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    fs.writeFileSync('scripts/output.txt', 'Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    let output = '--- Inspecting Jurnal Records ---\n';

    // 1. Get a few recent jurnal records
    const { data: records, error } = await supabase
        .from('jurnal_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        output += `Error fetching records: ${JSON.stringify(error)}\n`;
    } else {
        output += `Fetched ${records.length} records.\n`;

        if (records.length > 0) {
            output += 'Sample Record BloK Values:\n';
            records.forEach(r => {
                output += `- User: ${r.user_id.substring(0, 8)}..., Blok: "${r.blok}", Setor: ${r.tanggal_setor}\n`;
            });
        } else {
            output += 'No records found.\n';
        }
    }

    // 2. Get Juz Options to see Part info
    output += '\n--- Inspecting Juz Options ---\n';
    const { data: juzOptions } = await supabase.from('juz_options').select('*').limit(5);
    if (juzOptions) {
        juzOptions.forEach(j => {
            output += `Code: ${j.code}, Part: ${j.part}, Start: ${j.start_page}, End: ${j.end_page}\n`;
        });
    }

    fs.writeFileSync('scripts/output.txt', output);
    console.log('Done writing to scripts/output.txt');
}

inspectData();
