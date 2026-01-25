import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST() {
  try {
    // First, check if juz_options has any data
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('juz_options')
      .select('code')
      .limit(1);

    if (checkError) {
      console.error('Error checking juz_options:', checkError);
      return NextResponse.json(
        { error: 'Failed to check juz_options table', details: checkError },
        { status: 500 }
      );
    }

    // If data already exists, return early
    if (existingData && existingData.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'juz_options already has data',
        existing: existingData
      });
    }

    // Insert juz options for Batch 2 (Juz 1, 28, 29, 30)
    const juzOptions = [
      // Juz 1 (Al-Fatihah - Al-Baqarah)
      { code: '1A', name: 'Juz 1A - Al-Fatihah s/d Al-Baqarah 100', juz_number: 1, part: 'A', start_page: 1, end_page: 101, sort_order: 1, is_active: true },
      { code: '1B', name: 'Juz 1B - Al-Baqarah 101 s/d Akhir', juz_number: 1, part: 'B', start_page: 102, end_page: 202, sort_order: 2, is_active: true },
      // Juz 28 (An-Naba - Al-Mutaffifin)
      { code: '28A', name: 'Juz 28A - An-Naba s/d Abasa', juz_number: 28, part: 'A', start_page: 582, end_page: 592, sort_order: 3, is_active: true },
      { code: '28B', name: 'Juz 28B - At-Takwir s/d Al-Mutaffifin', juz_number: 28, part: 'B', start_page: 593, end_page: 604, sort_order: 4, is_active: true },
      // Juz 29 (Al-Mulk - An-Naba)
      { code: '29A', name: 'Juz 29A - Al-Mulk s/d Al-Jinn', juz_number: 29, part: 'A', start_page: 562, end_page: 573, sort_order: 5, is_active: true },
      { code: '29B', name: 'Juz 29B - Al-Muzzammil s/d An-Naba (sebelum An-Naba)', juz_number: 29, part: 'B', start_page: 574, end_page: 581, sort_order: 6, is_active: true },
      // Juz 30 (An-Naba - An-Nas)
      { code: '30A', name: 'Juz 30A - An-Naba s/d Al-Buruj', juz_number: 30, part: 'A', start_page: 582, end_page: 591, sort_order: 7, is_active: true },
      { code: '30B', name: 'Juz 30B - At-Tariq s/d An-Nas', juz_number: 30, part: 'B', start_page: 592, end_page: 604, sort_order: 8, is_active: true },
    ];

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('juz_options')
      .insert(juzOptions)
      .select();

    if (insertError) {
      console.error('Error inserting juz_options:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert juz_options', details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'juz_options seeded successfully',
      count: insertedData?.length || 0,
      data: insertedData
    });
  } catch (error: any) {
    console.error('Error in seed-juz API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Also allow GET to check status
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('juz_options')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch juz_options', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
