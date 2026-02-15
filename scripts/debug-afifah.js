const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Hardcoded for debugging purposes
const supabaseUrl = "https://nmbvklixthlqtkkgqnjl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    let output = '--- Inspecting Data for Troubleshooting ---\n';

    // 1. Find User IDs for names like "Afifah", "Aam", "Agustina"
    const names = ['Afifah', 'Aam', 'Agustina'];
    const userIds = [];

    for (const name of names) {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, full_name')
            .ilike('full_name', `%${name}%`);

        if (users && users.length > 0) {
            output += `\nFound users matching "${name}":\n`;
            users.forEach(u => {
                output += `- ${u.full_name} (${u.id})\n`;
                userIds.push(u.id);
            });
        } else {
            output += `\nNo users found matching "${name}"\n`;
        }
    }

    // 2. Fetch Jurnal Records for these users
    if (userIds.length > 0) {
        output += '\n--- Jurnal Records ---\n';
        const { data: records, error } = await supabase
            .from('jurnal_records')
            .select('*')
            .in('user_id', userIds)
            .order('created_at', { ascending: false });

        if (error) {
            output += `Error fetching records: ${JSON.stringify(error)}\n`;
        } else {
            output += `Fetched ${records.length} records.\n`;
            records.forEach(r => {
                output += `User: ${r.user_id.substring(0, 8)}... | Blok: "${r.blok}" | Setor: ${r.tanggal_setor}\n`;
            });
        }
    }

    // 3. Inspect Juz Options
    output += '\n--- Juz Options ---\n';
    const { data: juzOptions } = await supabase.from('juz_options').select('*');
    if (juzOptions) {
        juzOptions.forEach(j => {
            output += `Code: ${j.code}, Part: ${j.part}, Start: ${j.start_page}, End: ${j.end_page}\n`;
        });
    }

    fs.writeFileSync('scripts/debug_output.txt', output);
    console.log('Done writing to scripts/debug_output.txt');
    process.exit(0);
}

inspectData();
