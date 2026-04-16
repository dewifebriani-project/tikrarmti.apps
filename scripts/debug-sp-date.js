const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBatch() {
    function log(msg) {
        console.log(msg);
        try {
            fs.appendFileSync('scripts/debug-sp-date-direct.txt', msg + '\n');
        } catch (e) {
            // ignore
        }
    }

    // Clear file first
    try {
        fs.writeFileSync('scripts/debug-sp-date-direct.txt', '');
    } catch (e) { }

    log('Fetching active batch...');
    const { data: batch, error } = await supabase
        .from('batches')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        log('Error fetching batch: ' + JSON.stringify(error));
        process.exit(1);
    }

    if (!batch) {
        log('No active batch found!');
        process.exit(0);
    }

    log('Active Batch: ' + batch.name);
    log('Batch Start Date: ' + batch.start_date);

    if (!batch.start_date) {
        log('Start Date is NULL. Weeks effectively start immediately/today.');
        process.exit(0);
    }

    const startDate = new Date(batch.start_date);

    // "First week starts 3 weeks after batch start_date"
    const firstWeekStart = new Date(startDate);
    firstWeekStart.setDate(firstWeekStart.getDate() + 21); // +3 weeks

    log('First Week Start Rule (Start + 21 days): ' + firstWeekStart.toISOString());

    const now = new Date();
    log('Current Time: ' + now.toISOString());

    // Week 1 Ends
    // "Week 1 = firstWeekStart to firstWeekStart + 6 days"
    const week1End = new Date(firstWeekStart);
    week1End.setDate(week1End.getDate() + 6);
    week1End.setHours(23, 59, 59, 999);

    log('Week 1 Expected End (Sunday): ' + week1End.toISOString());

    const hasEnded = now > week1End;
    log('Has Week 1 Ended? ' + hasEnded);

    if (!hasEnded) {
        log('CONCLUSION: Week 1 calculation says NO SPs should be generated yet.');
    } else {
        log('CONCLUSION: Week 1 HAS ended. SPs should be pending if user has no jurnal.');
    }

    // Also check week 2, 3, 4
    for (let i = 2; i <= 4; i++) {
        const weekEnd = new Date(firstWeekStart);
        weekEnd.setDate(weekEnd.getDate() + ((i - 1) * 7) + 6);
        weekEnd.setHours(23, 59, 59, 999);
        log(`Week ${i} Ends At: ${weekEnd.toISOString()}`);
        log(`Has Week ${i} Ended? ${now > weekEnd}`);
    }

    process.exit(0);
}

checkBatch();
