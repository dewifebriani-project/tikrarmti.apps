import { NextResponse, NextRequest } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedBatchId = searchParams.get('batchId');

    let batchIdToUse = requestedBatchId;

    // If no batchId is provided, try to find an 'open' batch
    if (!batchIdToUse) {
      const { data: openBatch, error: batchError } = await supabaseAdmin
        .from('batches')
        .select('id')
        .eq('status', 'open')
        .limit(1)
        .single();
      
      if (!batchError && openBatch) {
        batchIdToUse = openBatch.id;
      }
    }

    // Get all juz options, ordered by sort_order
    const { data: allJuz, error: juzError } = await supabaseAdmin
      .from('juz_options')
      .select('*')
      .order('sort_order', { ascending: true });

    if (juzError) {
      console.error('Error fetching juz options:', juzError);
      return NextResponse.json(
        { error: 'Failed to fetch juz options' },
        { status: 500 }
      );
    }

    let activeJuzOptions = allJuz;

    // If we have a batch ID, filter by batch_juz_options
    if (batchIdToUse) {
      const { data: mappedJuz, error: mapError } = await supabaseAdmin
        .from('batch_juz_options')
        .select('juz_code')
        .eq('batch_id', batchIdToUse)
        .eq('is_active', true);

      // If there is no error (meaning table exists) and we got some mappings
      // If table doesn't exist, we fall back to allJuz.
      if (!mapError) {
        // If there are no mappings at all, it might mean the admin hasn't set them up yet.
        // We could return empty or fallback to the old global `is_active`. 
        // For safety, let's strictly use the mapping. If empty, it's empty.
        const activeCodes = new Set(mappedJuz?.map(m => m.juz_code) || []);
        if (activeCodes.size > 0) {
          activeJuzOptions = allJuz.filter(juz => activeCodes.has(juz.code));
        } else {
           // Fallback to global is_active if no mapping is found for the batch (e.g., newly created batch without juz)
           activeJuzOptions = allJuz.filter(juz => juz.is_active);
        }
      } else {
        // Fallback to global is_active if table missing
        activeJuzOptions = allJuz.filter(juz => juz.is_active);
      }
    } else {
      // Fallback if no batch is active
      activeJuzOptions = allJuz.filter(juz => juz.is_active);
    }

    return NextResponse.json({ data: activeJuzOptions || [] });
  } catch (error) {
    console.error('Error in juz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
