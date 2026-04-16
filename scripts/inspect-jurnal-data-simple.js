const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('--- Inspecting Jurnal Records ---');

    const { data: records, error } = await supabase
        .from('jurnal_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching records:', error);
    } else {
        console.log(`Fetched ${records.length} records.`);
        if (records.length > 0) {
            console.log('Sample Record Blok Values:');
            records.forEach(r => {
                console.log(`- User: ${r.user_id}, Blok: "${r.blok}", Setor: ${r.tanggal_setor}`);
            });
        } else {
            console.log('No records found.');
        }
    }

    console.log('\n--- Inspecting Juz Options ---');
    const { data: juzOptions } = await supabase.from('juz_options').select('*').limit(5);
    if (juzOptions) {
        juzOptions.forEach(j => {
            console.log(`Code: ${j.code}, Part: ${j.part}, Start: ${j.start_page}, End: ${j.end_page}`);
        });
    }

    // Force exit to ensure command completes
    process.exit(0);
}

inspectData();
