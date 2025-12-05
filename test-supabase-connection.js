const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test basic connection - try alternative table name
    const { data, error } = await supabase
      .from('pendaftaran')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error);
      return;
    }

    console.log('✅ Connection successful');

    // Get recent submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('pendaftaran')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching submissions:', fetchError);
      return;
    }

    console.log('\n📊 Recent submissions:');
    console.log('Total submissions found:', submissions.length);

    if (submissions.length > 0) {
      submissions.forEach((sub, index) => {
        console.log(`\n${index + 1}. ID: ${sub.id}`);
        console.log(`   Name: ${sub.full_name}`);
        console.log(`   Email: ${sub.email}`);
        console.log(`   Status: ${sub.status}`);
        console.log(`   Created: ${sub.created_at}`);
        // Try to get batch info if available
        console.log(`   Batch: ${sub.batch_name || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️ No submissions found yet');
    }

    // Test table structure
    const { data: columns } = await supabase
      .from('pendaftaran')
      .select('*')
      .limit(1);

    if (columns && columns.length > 0) {
      console.log('\n📋 Table columns:', Object.keys(columns[0]));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testConnection();