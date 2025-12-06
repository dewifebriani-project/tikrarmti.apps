import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get open/active batch for tikrar tahfidz
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('name', 'Tikrar MTI Batch 2')
      .in('status', ['open', 'active']) // Accept both 'open' and 'active' status
      .single();

    if (batchError || !batch) {
      console.error('Error fetching batch:', batchError);
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Hitung total pendaftar dari tabel tikrar_tahfidz
    const { data: registrations, error: regError } = await supabase
      .from('tikrar_tahfidz')
      .select('id')
      .eq('batch_id', batch.id);

    const registeredCount = regError ? 0 : (registrations?.length || 0);

    // Get program for tikrar tahfidz
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, name')
      .eq('name', 'Tahfidz') // Changed from 'Tikrar Tahfidz' to 'Tahfidz'
      .single();

    if (programError || !program) {
      console.error('Error fetching program:', programError);
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Fallback values for fields that might not exist yet
    const is_free = batch.is_free ?? true; // Default: program is FREE
    const price = batch.price ?? 0; // Default: price is 0 (FREE)
    const total_quota = batch.total_quota ?? 100; // Default: 100 participants
    const availableQuota = total_quota - registeredCount;

    return NextResponse.json({
      batch_id: batch.id,
      batch_name: batch.name,
      program_id: program.id,
      program_name: program.name,
      start_date: batch.start_date,
      end_date: batch.end_date,
      duration_weeks: batch.duration_weeks,
      price: price,
      is_free: is_free,
      total_quota: total_quota,
      registered_count: registeredCount,
      scholarship_quota: availableQuota // Kuota tersedia
    });
  } catch (error) {
    console.error('Error fetching default batch/program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}