const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nmbvklixthlqtkkgqnjl.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTMzMzcsImV4cCI6MjA1NDgzMzMzN30.C6dM4Q1X82i7E0q501n25c1F30f423z422k5c01r02";

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
