import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';

/**
 * GET /api/alumni/donations/my
 * Get logged-in user's donation history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: donations, error } = await supabase
      .from('donations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Alumni Donations My GET] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(donations);
  } catch (error: any) {
    console.error('[Alumni Donations My GET] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * POST /api/alumni/donations/my
 * Submit a new donation confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, donor_name, whatsapp, proof_url, notes } = body;

    // Validation
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah donasi harus berupa angka lebih besar dari 0' }, { status: 400 });
    }

    if (!donor_name || typeof donor_name !== 'string' || donor_name.trim() === '') {
      return NextResponse.json({ error: 'Nama donatur wajib diisi' }, { status: 400 });
    }

    if (!proof_url || typeof proof_url !== 'string' || proof_url.trim() === '') {
      return NextResponse.json({ error: 'Bukti transfer wajib diunggah' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('donations')
      .insert({
        user_id: user.id,
        amount: numericAmount,
        donor_name: donor_name.trim(),
        whatsapp: whatsapp ? whatsapp.trim() : null,
        proof_url: proof_url.trim(),
        notes: notes ? notes.trim() : null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[Alumni Donations My POST] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(data, 'Konfirmasi donasi berhasil dikirim', 201);
  } catch (error: any) {
    console.error('[Alumni Donations My POST] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
