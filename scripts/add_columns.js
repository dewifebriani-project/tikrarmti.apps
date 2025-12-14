const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColumns() {
  try {
    console.log('🔄 Adding missing columns to batches table...')

    const sql = `
      -- Add is_free column (default: true for free programs)
      ALTER TABLE public.batches
      ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true;

      -- Add price column (default: 0 for free programs)
      ALTER TABLE public.batches
      ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0;

      -- Add total_quota column (default: 100 participants)
      ALTER TABLE public.batches
      ADD COLUMN IF NOT EXISTS total_quota integer DEFAULT 100;

      -- Add constraint to ensure total_quota is positive
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'check_total_quota_positive'
        ) THEN
          ALTER TABLE public.batches
          ADD CONSTRAINT check_total_quota_positive CHECK (total_quota > 0);
        END IF;
      END $$;

      -- Add constraint to ensure price is non-negative
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'check_price_non_negative'
        ) THEN
          ALTER TABLE public.batches
          ADD CONSTRAINT check_price_non_negative CHECK (price >= 0);
        END IF;
      END $$;
    `

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('❌ Error adding columns:', error)
      console.log('\n📋 Please run the SQL script manually in Supabase SQL Editor:')
      console.log('   File: scripts/add_batch_columns.sql')
      return
    }

    console.log('✅ Successfully added columns to batches table!')

    // Verify the columns exist
    const { data: verifyData, error: verifyError } = await supabase
      .from('batches')
      .select('*')
      .limit(1)

    if (verifyError) {
      console.error('❌ Error verifying columns:', verifyError)
      return
    }

    console.log('\n✅ Columns added successfully! You can now run the create_batch.js script.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.log('\n📋 Please run the SQL script manually in Supabase SQL Editor:')
    console.log('   File: scripts/add_batch_columns.sql')
  }
}

addColumns()
