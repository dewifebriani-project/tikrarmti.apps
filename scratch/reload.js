const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// Oh wait, supabase-js might not run the RPC correctly without auth.
