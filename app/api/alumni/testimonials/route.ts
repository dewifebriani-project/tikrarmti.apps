import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all approved testimonials with user full_name and kota (domicile)
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        content,
        rating,
        created_at,
        user:users (
          full_name,
          kota
        )
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Alumni Testimonials GET API] Database error:', error);
      return NextResponse.json({ error: 'Gagal memuat testimoni', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: testimonials || []
    });
  } catch (error: any) {
    console.error('[Alumni Testimonials GET API] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
