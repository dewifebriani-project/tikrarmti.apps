import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET() {
  try {
    // Test 1: Check if column exists
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, current_tikrar_batch_id')
      .limit(5);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 500 });
    }

    // Test 2: Try to fetch with join
    const { data: usersWithBatch, error: joinError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        current_tikrar_batch_id,
        current_tikrar_batch:batches!users_current_tikrar_batch_id_fkey(
          id,
          name,
          status
        )
      `)
      .limit(5);

    if (joinError) {
      return NextResponse.json({
        success: false,
        step: 'join_failed',
        error: joinError.message,
        details: joinError,
        basic_query_worked: true,
        basic_data: users,
      }, { status: 500 });
    }

    // Test 3: Check users with batch
    const usersWithBatchCount = users?.filter(u => u.current_tikrar_batch_id).length || 0;

    return NextResponse.json({
      success: true,
      results: {
        total_users_checked: users?.length || 0,
        users_with_batch_id: usersWithBatchCount,
        basic_query: users,
        query_with_join: usersWithBatch,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
