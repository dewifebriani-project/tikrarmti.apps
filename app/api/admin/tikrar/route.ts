import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const skipCount = searchParams.get('skipCount') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1000'), 1000); // Increased max to 1000
    const offset = (page - 1) * limit;

    // Fetch tikrar data with admin client (bypasses RLS)
    console.log('Starting tikrar data fetch at', new Date().toISOString());
    console.log('Query parameters:', { skipCount, page, limit, offset });

    // If skipCount is true, load ALL data without pagination
    // First, fetch tikrar data
    let query = supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('*')
      .order('submission_date', { ascending: false });

    // Only apply range if NOT skipping count (i.e., if using pagination)
    if (!skipCount) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    console.log('Query completed at', new Date().toISOString());
    console.log('Data length:', data?.length || 0);

    if (error) {
      console.error('Error fetching tikrar data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data', details: error.message },
        { status: 500 }
      );
    }

    // Fetch exam_attempts (written quiz scores) for all registrations
    let enrichedData = data || [];
    if (data && data.length > 0) {
      const registrationIds = data.map((r: any) => r.id);

      // Fetch exam attempts for these registrations
      // Get the highest score attempt for each registration (for written quiz)
      const { data: examAttempts } = await supabaseAdmin
        .from('exam_attempts')
        .select('id, registration_id, score, status, submitted_at, created_at')
        .in('registration_id', registrationIds)
        .order('created_at', { ascending: false });

      // Create a map of registration_id -> exam attempt (first/latest attempt)
      const examAttemptsMap = new Map();
      if (examAttempts) {
        for (const attempt of examAttempts) {
          // Store the first/latest attempt for each registration
          if (!examAttemptsMap.has(attempt.registration_id)) {
            examAttemptsMap.set(attempt.registration_id, attempt);
          }
        }
      }

      // Enrich data with exam score
      enrichedData = data.map((tikrar: any) => {
        const examAttempt = examAttemptsMap.get(tikrar.id);
        return {
          ...tikrar,
          // Use exam_attempts.score as written_quiz_score
          written_quiz_score: examAttempt?.score ?? tikrar.written_quiz_score,
          written_exam_submitted_at: examAttempt?.submitted_at ?? tikrar.written_exam_submitted_at,
          written_exam_status: examAttempt?.status ?? tikrar.written_exam_status,
        };
      });
    }

    // Get total count for pagination
    let totalCount = data?.length || 0;
    if (!skipCount) {
      console.log('Starting count query at', new Date().toISOString());
      const { count } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select('*', { count: 'estimated', head: true });
      totalCount = count || 0;
      console.log('Count query completed at', new Date().toISOString());
      console.log('Total count:', totalCount);
    }

    return NextResponse.json({
      success: true,
      data: enrichedData || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}