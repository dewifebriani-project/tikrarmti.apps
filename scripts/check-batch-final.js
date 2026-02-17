const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://nmbvklixthlqtkkgqnjl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNTMzMzcsImV4cCI6MjA1NDgzMzMzN30.C6dM4Q1X82i7E0q501n25c1F30f423z422k5c01r02";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBatch() {
    try {
        const { data: batch, error } = await supabase
            .from('batches')
            .select('*')
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.log('Error:', error);
            fs.writeFileSync('batch-final-output.txt', JSON.stringify({ error }, null, 2));
            return;
        }

        if (!batch) {
            console.log('No batch found');
            fs.writeFileSync('batch-final-output.txt', JSON.stringify({ error: 'No batch found' }, null, 2));
            return;
        }

        const output = {
            name: batch.name,
            start_date: batch.start_date,
            first_week_start_date: batch.first_week_start_date,
            review_week_start_date: batch.review_week_start_date,
            opening_class_date: batch.opening_class_date,
            current_time: new Date().toISOString()
        };

        console.log(JSON.stringify(output, null, 2));
        fs.writeFileSync('batch-final-output.txt', JSON.stringify(output, null, 2));
        console.log('Done');
    } catch (e) {
        console.log('Exception:', e);
        fs.writeFileSync('batch-final-output.txt', JSON.stringify({ error: e.message }, null, 2));
    }
}

checkBatch();
