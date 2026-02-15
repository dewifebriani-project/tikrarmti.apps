import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('--- Inspecting Jurnal Records ---');

    // 1. Get a few recent jurnal records
    const { data: records, error } = await supabase
        .from('jurnal_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching records:', error);
        return;
    }

    console.log(`Fetched ${records.length} records.`);

    if (records.length > 0) {
        console.log('Sample Record BloK Values:');
        records.forEach(r => {
            console.log(`- User: ${r.user_id.substring(0, 8)}..., Blok: "${r.blok}", Setor: ${r.tanggal_setor}`);
        });
    }

    // 2. Get Juz Options to see Part info
    console.log('\n--- Inspecting Juz Options ---');
    const { data: juzOptions } = await supabase.from('juz_options').select('*').limit(5);
    juzOptions?.forEach(j => {
        console.log(`Code: ${j.code}, Part: ${j.part}, Start: ${j.start_page}, End: ${j.end_page}`);
    });
}

inspectData();
