import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Create service client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let registration = null;
    let error = null;

    // First try to find by user_id if provided
    if (userId) {
      console.log('Querying with user_id:', userId);
      const result = await serviceSupabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      registration = result.data;
      error = result.error;
    }

    // If not found by user_id, try by email
    if (!registration && !error && email) {
      console.log('No registration found by user_id, trying email search...');
      const result = await serviceSupabase
        .from('pendaftaran_tikrar_tahfidz')
        .select('*')
        .eq('email', email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      registration = result.data;
      error = result.error;

      // Update user_id if different
      if (registration && !error && userId && registration.user_id !== userId) {
        console.log('Updating user_id for registration:', registration.id);
        await serviceSupabase
          .from('pendaftaran_tikrar_tahfidz')
          .update({ user_id: userId })
          .eq('id', registration.id);
      }
    }

    if (registration) {
      return NextResponse.json({
        hasRegistered: true,
        registration: {
          id: registration.id,
          status: registration.status,
          selection_status: registration.selection_status,
          submission_date: registration.submission_date,
          chosen_juz: registration.chosen_juz,
          batch_name: registration.batch_name,
          full_name: registration.full_name
        }
      });
    }

    return NextResponse.json({
      hasRegistered: false
    });

  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}