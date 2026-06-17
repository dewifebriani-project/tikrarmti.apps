import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponses } from '@/lib/api-responses';

// Helper to check if a user is an alumnus
async function checkIsAlumnus(supabase: any, userId: string): Promise<boolean> {
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, status, selection_status, batch:batches(id, end_date, status)')
    .eq('user_id', userId);

  if (error || !regs) {
    return false;
  }

  const now = new Date();
  return regs.some((reg: any) => {
    const isApproved = reg.status === 'approved';
    const isSelected = reg.selection_status === 'selected';
    if (!isApproved || !isSelected) return false;
    
    const batch = reg.batch;
    if (!batch) return false;
    
    const endDate = batch.end_date ? new Date(batch.end_date) : null;
    return (endDate && endDate < now) || batch.status === 'archived';
  });
}

/**
 * GET /api/alumni/testimonial/my
 * Check alumni status and retrieve testimonial
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAlumnus = await checkIsAlumnus(supabase, user.id);

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();
    const isAdmin = userData?.roles?.includes('admin') || false;

    // Fetch the testimonial if it exists
    const { data: testimonial, error: testimonialError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (testimonialError) {
      console.error('[Alumni Testimonial My GET] Error fetching testimonial:', testimonialError);
    }

    return NextResponse.json({
      isAlumni: isAlumnus,
      isAdmin,
      testimonial: testimonial || null
    });
  } catch (error: any) {
    console.error('[Alumni Testimonial My GET] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * POST /api/alumni/testimonial/my
 * Create or update testimonial (resets is_approved to false)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an alumnus or admin
    const isAlumnus = await checkIsAlumnus(supabase, user.id);
    const { data: userData } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();
    const isAdmin = userData?.roles?.includes('admin') || false;

    if (!isAlumnus && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Only alumni or admins can submit testimonials' }, { status: 403 });
    }

    const body = await request.json();
    const { content, rating } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Upsert testimonial
    const { data, error } = await supabase
      .from('testimonials')
      .upsert({
        user_id: user.id,
        content: content.trim(),
        rating: Math.floor(numericRating),
        is_approved: false, // Reset approval status for review
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Alumni Testimonial My POST] Database error:', error);
      return NextResponse.json({ error: 'Failed to save testimonial', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial saved successfully and is pending admin approval',
      data
    });
  } catch (error: any) {
    console.error('[Alumni Testimonial My POST] Server error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
