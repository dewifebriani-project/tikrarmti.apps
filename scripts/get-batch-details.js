const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getBatch() {
    try {
        const { data, error } = await supabase
            .from('batches')
            .select('*')
            .eq('status', 'open');

        if (error) {
            console.error(error);
            fs.writeFileSync('output-new.txt', JSON.stringify(error, null, 2));
            process.exit(1);
        }

        console.log(JSON.stringify(data, null, 2));
        fs.writeFileSync('output-new.txt', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        fs.writeFileSync('output-new.txt', JSON.stringify({ error: e.message }, null, 2));
        process.exit(1);
    }
}

getBatch();
