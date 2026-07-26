import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * RETIRED: this was a one-off migration (add is_free/price/total_quota columns
 * to batches, then hardcode-update "Tikrar MTI Batch 2") that shipped as a live,
 * UNAUTHENTICATED POST route running arbitrary ALTER TABLE DDL via exec_sql —
 * anyone could hit this with no login at all. The migration it existed for is
 * done (see supabase/migrations/ for the real column additions), so disabling
 * rather than deleting (keeps git history/context). Do not re-enable this
 * without a requireAdmin() check, and preferably without raw exec_sql DDL.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'This one-off migration endpoint has been retired.' },
    { status: 410 }
  );
}

async function _disabled_originalHandler() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting migration to add price fields to batches table...');

    // Step 1: Add is_free column
    console.log('Step 1: Adding is_free column...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT TRUE;`
    });
    if (error1) console.log('⚠️  is_free column might already exist or needs manual migration');

    // Step 2: Add price column
    console.log('Step 2: Adding price column...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;`
    });
    if (error2) console.log('⚠️  price column might already exist or needs manual migration');

    // Step 3: Add total_quota column
    console.log('Step 3: Adding total_quota column...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.batches ADD COLUMN IF NOT EXISTS total_quota INTEGER DEFAULT 100;`
    });
    if (error3) console.log('⚠️  total_quota column might already exist or needs manual migration');

    // Step 4: Update existing batch
    console.log('Step 4: Updating Tikrar MTI Batch 2 data...');
    const { data: updateData, error: updateError } = await supabase
      .from('batches')
      .update({
        is_free: true,
        price: 0,
        total_quota: 100
      })
      .eq('name', 'Tikrar MTI Batch 2')
      .select();

    if (updateError) {
      console.error('❌ Error updating batch:', updateError);
      return NextResponse.json(
        {
          error: 'Migration failed during update',
          details: updateError,
          message: 'Please run the SQL migration manually in Supabase SQL Editor'
        },
        { status: 500 }
      );
    }

    // Step 5: Verify the update
    console.log('Step 5: Verifying migration...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('batches')
      .select('id, name, is_free, price, total_quota, duration_weeks, status')
      .eq('name', 'Tikrar MTI Batch 2')
      .single();

    if (verifyError) {
      return NextResponse.json(
        {
          error: 'Migration verification failed',
          details: verifyError,
          message: 'Columns might not be added yet. Please run SQL manually.'
        },
        { status: 500 }
      );
    }

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data: verifyData
    });

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
