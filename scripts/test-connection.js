console.log("Starting test...");
try {
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: '.env.local' });
    console.log("Module loaded successfully.");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Client created.");

    // Test connection
    supabase.from('juz_options').select('count', { count: 'exact', head: true })
        .then(({ count, error }) => {
            if (error) console.error("Error:", error);
            else console.log("Connection successful, count:", count);
        })
        .catch(err => console.error("Catch:", err));
} catch (e) {
    console.error("Crash:", e);
}
