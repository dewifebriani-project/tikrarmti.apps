import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/debug/halaqah-muallimah-reg
 * Debug endpoint to check muallimah_registrations data
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();

    // Get a sample halaqah
    const { data: halaqah, error: halaqahError } = await supabaseAdmin
      .from('halaqah')
      .select('id, name, muallimah_id, program_id')
      .limit(1)
      .single();

    if (halaqahError) {
      return NextResponse.json({ error: 'Failed to fetch halaqah', details: halaqahError }, { status: 500 });
    }

    // Get program with batch
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('*, batch:batches(*)')
      .eq('id', halaqah.program_id)
      .single();

    // Get muallimah_registrations
    const batchId = program?.batch?.id || program?.batch_id;

    const { data: muallimahReg, error: regError } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('*')
      .eq('user_id', halaqah.muallimah_id)
      .eq('batch_id', batchId)
      .maybeSingle();

    // List all muallimah_registrations for this user
    const { data: allRegs, error: allRegsError } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('id, user_id, batch_id, class_type, preferred_schedule, status')
      .eq('user_id', halaqah.muallimah_id);

    return NextResponse.json({
      halaqah,
      program,
      batchId,
      muallimahReg,
      regError,
      allRegs,
      allRegsError
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
