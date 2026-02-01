import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating halaqah
const createHalaqahSchema = z.object({
  name: z.string().min(1, 'Nama halaqah wajib diisi'),
  description: z.string().optional(),
  day_of_week: z.number().min(1).max(7).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  max_students: z.number().min(1).default(20),
  zoom_link: z.string().url().optional().or(z.literal('')),
  preferred_juz: z.string().optional(),
  waitlist_max: z.number().min(0).default(5),
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has muallimah role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = userData?.roles || [];
    if (!roles.includes('muallimah')) {
      return NextResponse.json({ error: 'Forbidden: Muallimah access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createHalaqahSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validationResult.error.issues,
      }, { status: 400 });
    }

    const data = validationResult.data;

    // Get current active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!activeBatch) {
      return NextResponse.json({ error: 'No active batch found' }, { status: 400 });
    }

    // Create halaqah
    const { data: halaqah, error } = await supabase
      .from('halaqah')
      .insert({
        name: data.name,
        description: data.description || null,
        day_of_week: data.day_of_week || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        max_students: data.max_students,
        zoom_link: data.zoom_link || null,
        muallimah_id: user.id,
        preferred_juz: data.preferred_juz || null,
        waitlist_max: data.waitlist_max,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: halaqah });
  } catch (error: any) {
    console.error('Error in muallimah create halaqah API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
