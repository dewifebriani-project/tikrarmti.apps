console.log("Starting test...");
try {
    const { createClient } = require('@supabase/supabase-js');
    console.log("Module loaded successfully.");
    const supabaseUrl = "https://nmbvklixthlqtkkgqnjl.supabase.co";
    const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYnZrbGl4dGhscXRra2dxbmpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYyNTgyOSwiZXhwIjoyMDgwMjAxODI5fQ.PVvANGhrqKOvqdOSuNQyC4fDMypJCiMBwxuDm_2aMIs";
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
