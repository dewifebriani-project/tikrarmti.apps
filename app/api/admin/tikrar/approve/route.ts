import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    console.log('=== Approve Tikrar API Started ===');

    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const { id, updateData } = await request.json();

    console.log('=== Approve Tikrar API Called ===');
    console.log('Request body:', { id, updateData, userId: user.id });

    if (!id || !updateData) {
      console.error('Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the tikrar application using admin client (bypasses RLS)
    const { error, data } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .update({
        ...updateData,
        approved_by: user.id
      })
      .eq('id', id)
      .select();

    console.log('Update result:', { error, data });

    if (error) {
      console.error('Error updating tikrar application:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Tikrar application updated successfully');
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in approve tikrar API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}