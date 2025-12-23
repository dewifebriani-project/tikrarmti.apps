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
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all stats using admin client (bypasses RLS)
    // Initialize with default values
    const stats: any = {
      totalBatches: 0,
      totalPrograms: 0,
      totalHalaqah: 0,
      totalUsers: 0,
      totalThalibah: 0,
      totalMentors: 0,
      pendingRegistrations: 0,
      pendingTikrar: 0
    };

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 8000);
    });

    // Get counts in parallel with timeout protection
    try {
      const promises = [
        // Basic counts
        supabaseAdmin.from('batches').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('programs').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('halaqah').select('*', { count: 'exact', head: true }),

        // User counts
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'thalibah'),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).in('role', ['ustadzah', 'musyrifah']),

        // Pending counts
        supabaseAdmin.from('pendaftaran').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('pendaftaran_tikrar_tahfidz').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ];

      // Race between the queries and timeout
      const results = await Promise.race([
        Promise.allSettled(promises),
        timeoutPromise
      ]);

      if (Array.isArray(results)) {
        // Extract counts from results
        if (results[0].status === 'fulfilled') {
          stats.totalBatches = results[0].value.count || 0;
        }
        if (results[1].status === 'fulfilled') {
          stats.totalPrograms = results[1].value.count || 0;
        }
        if (results[2].status === 'fulfilled') {
          stats.totalHalaqah = results[2].value.count || 0;
        }
        if (results[3].status === 'fulfilled') {
          stats.totalUsers = results[3].value.count || 0;
        }
        if (results[4].status === 'fulfilled') {
          stats.totalThalibah = results[4].value.count || 0;
        }
        if (results[5].status === 'fulfilled') {
          stats.totalMentors = results[5].value.count || 0;
        }
        if (results[6].status === 'fulfilled') {
          stats.pendingRegistrations = results[6].value.count || 0;
        }
        if (results[7].status === 'fulfilled') {
          stats.pendingTikrar = results[7].value.count || 0;
        }

        // Log any errors for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const fieldNames = ['batches', 'programs', 'halaqah', 'users', 'thalibah', 'mentors', 'pendaftaran', 'tikrar'];
            console.error(`Error getting ${fieldNames[index]} count:`, result.reason);
          }
        });
      }
    } catch (error: any) {
      if (error.message === 'Database query timeout') {
        console.error('Stats query timeout after 8 seconds, returning partial data');
      } else {
        console.error('Unexpected error in stats query:', error);
      }
      // Return default values (already set)
    }

  
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error('Error in admin stats API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
