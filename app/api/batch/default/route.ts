import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get active batch for tikrar tahfidz
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('id, name')
      .eq('name', 'Tikrar MTI Batch 2')
      .eq('status', 'active')
      .single();

    if (batchError || !batch) {
      console.error('Error fetching batch:', batchError);
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get program for tikrar tahfidz
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('name', 'Tikrar Tahfidz')
      .single();

    if (programError || !program) {
      console.error('Error fetching program:', programError);
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      batch_id: batch.id,
      batch_name: batch.name,
      program_id: program.id,
      program_name: program.name
    });
  } catch (error) {
    console.error('Error fetching default batch/program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}