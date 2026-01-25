// API Route: /api/batches/[id]
// Fetch single batch by ID

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batchId = params.id;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID required' }, { status: 400 });
    }

    // Fetch batch by ID
    const { data: batch, error } = await supabaseAdmin
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) {
      logger.error('Error fetching batch', { error, batchId });
      return NextResponse.json({
        error: 'Failed to fetch batch',
        details: error.message
      }, { status: 500 });
    }

    if (!batch) {
      return NextResponse.json({
        error: 'Batch not found'
      }, { status: 404 });
    }

    // Return batch directly, not wrapped in { batch: ... }
    return NextResponse.json(batch);

  } catch (error) {
    logger.error('Error in GET /api/batches/[id]', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
