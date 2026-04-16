import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
            fs.writeFileSync('batch-final-output.txt', JSON.stringify({ error }, null, 2));
            return;
        }

        if (!batch) {
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

        fs.writeFileSync('batch-final-output.txt', JSON.stringify(output, null, 2));
        console.log('Done');
    } catch (e: any) {
        fs.writeFileSync('batch-final-output.txt', JSON.stringify({ error: e.message }, null, 2));
    }
}

checkBatch();
