import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

/**
 * GET /api/pendaftaran/my
 * 
 * Secure substitute for the user's own pendaftaran records with fallback matching.
 */
export async function GET(request: Request) {
  try {
    const response = new NextResponse();
    const context = await getAuthorizationContext({ response });
    if (!context) return ApiResponses.unauthorized();

    const supabase = createClient({ response });
    const supabaseAdmin = createSupabaseAdmin();

    // 1. Try fetching by user_id first
    const { data: tikrarById, error: errorById } = await supabase
      .from('pendaftaran_tikrar_tahfidz')
      .select(`
        *,
        program:programs(*),
        batch:batches(*)
      `)
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false });

    if (errorById) {
      console.error('[Pendaftaran My] Error fetching by ID:', errorById);
    }

    let tikrarRegistrations = tikrarById || [];

    // 2. Fallback matching if no records found by user_id
    // This is critical for users who registered via older systems or as guests
    if (tikrarRegistrations.length === 0 && context.email) {
      console.log(`[Pendaftaran My] No records for user_id ${context.userId}. Searching by email fallback: ${context.email}`);
      
      // Search by email (case-insensitive) using admin client to bypass RLS
      const { data: tikrarByEmail, error: fallbackError } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          program:programs(*),
          batch:batches(*)
        `)
        .ilike('email', context.email)
        .order('created_at', { ascending: false });

      if (fallbackError) {
        console.error('[Pendaftaran My] Fallback fetch error:', fallbackError);
      }

      if (tikrarByEmail && tikrarByEmail.length > 0) {
        console.log(`[Pendaftaran My] Found ${tikrarByEmail.length} records by email. Auto-healing user_id link...`);
        tikrarRegistrations = tikrarByEmail;
        
        // Auto-heal: Link these registrations to the correct user_id
        for (const reg of tikrarByEmail) {
          if (!reg.user_id || reg.user_id !== context.userId) {
            await supabaseAdmin
              .from('pendaftaran_tikrar_tahfidz')
              .update({ user_id: context.userId })
              .eq('id', reg.id);
          }
        }
      }
    }

    // 3. Fetch daftar ulang submissions for these registrations
    const { data: daftarUlangSubmissions, error: daftarUlangError } = await supabase
      .from('daftar_ulang_submissions')
      .select(`
        *,
        batch:batches(*),
        ujian_halaqah:halaqah!daftar_ulang_submissions_ujian_halaqah_id_fkey(*),
        tashih_halaqah:halaqah!daftar_ulang_submissions_tashih_halaqah_id_fkey(*)
      `)
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false });

    if (daftarUlangError) {
      console.error('[Pendaftaran My API] Database error (daftar_ulang):', daftarUlangError);
    }

    // 4. Structure final response
    // We include registrations from both OPEN and CLOSED batches.
    // 'closed' usually means registration is over but the batch is ACTIVE for ongoing students.
    const allRegistrations = tikrarRegistrations
      .map((reg: any) => {
        const batch = Array.isArray(reg.batch) ? reg.batch[0] : reg.batch;
        const daftarUlang = daftarUlangSubmissions?.find(dus => dus.registration_id === reg.id);

        return {
          ...reg,
          batch: batch || null,
          registration_type: 'thalibah',
          role: 'thalibah',
          status: reg.status || 'pending',
          batch_name: batch?.name || null,
          daftar_ulang: daftarUlang || null
        };
      })
      .filter((reg: any) => {
        // Only show registrations from active/meaningful batches to the dashboard
        // We include 'open' (recruiting) and 'closed' (ongoing)
        return reg.batch?.status === 'open' || reg.batch?.status === 'closed';
      });

    // 5. Sort by recency
    allRegistrations.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.submission_date || 0);
      const dateB = new Date(b.created_at || b.submission_date || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return ApiResponses.success(allRegistrations);
  } catch (error) {
    console.error('[Pendaftaran My API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
