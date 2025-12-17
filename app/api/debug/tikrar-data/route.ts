import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for debugging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    console.log('=== Debug: Checking Tikrar Data ===');

    // Test 1: Simple count query
    const { count, error: countError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({
        error: 'Failed to count records',
        details: countError
      }, { status: 500 });
    }

    console.log(`Total records: ${count}`);

    // Test 2: Get actual data (limit 5)
    const { data, error: dataError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        id,
        full_name,
        email,
        batch_name,
        status,
        submission_date,
        created_at
      `)
      .order('submission_date', { ascending: false })
      .limit(5);

    if (dataError) {
      console.error('Data fetch error:', dataError);
      return NextResponse.json({
        error: 'Failed to fetch data',
        details: dataError
      }, { status: 500 });
    }

    // Test 3: Check if table exists by trying to describe it
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      totalCount: count,
      sampleData: data,
      tableExists: !tableError || tableError.code !== 'PGRST116',
      tableError: tableError?.message || null,
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}