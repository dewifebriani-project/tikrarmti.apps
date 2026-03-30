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

    let tikrarRegistrations = tikrarById || [];

    // 2. Fallback matching if no records found by user_id
    if (tikrarRegistrations.length === 0 && context.email) {
      const supabaseAdmin = createSupabaseAdmin();

      // Search by email (case-insensitive) using admin client to bypass RLS
      const { data: tikrarByEmail } = await supabaseAdmin
        .from('pendaftaran_tikrar_tahfidz')
        .select(`
          *,
          program:programs(*),
          batch:batches(*)
        `)
        .ilike('email', context.email)
        .order('created_at', { ascending: false });

      if (tikrarByEmail && tikrarByEmail.length > 0) {
        tikrarRegistrations = tikrarByEmail;
        
        // Auto-fix user_id mismatch asynchronously (best effort)
        for (const reg of tikrarByEmail) {
          await supabaseAdmin
            .from('pendaftaran_tikrar_tahfidz')
            .update({ user_id: context.userId })
            .eq('id', reg.id);
        }
      } else {
        // Fallback to name match if profile exists
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('full_name')
          .eq('id', context.userId)
          .maybeSingle();

        if (userProfile?.full_name) {
          const { data: tikrarByName } = await supabaseAdmin
            .from('pendaftaran_tikrar_tahfidz')
            .select(`
              *,
              program:programs(*),
              batch:batches(*)
            `)
            .ilike('full_name', `%${userProfile.full_name}%`)
            .order('created_at', { ascending: false });

          if (tikrarByName && tikrarByName.length > 0) {
            tikrarRegistrations = tikrarByName;
            for (const reg of tikrarByName) {
              await supabaseAdmin
                .from('pendaftaran_tikrar_tahfidz')
                .update({ user_id: context.userId })
                .eq('id', reg.id);
            }
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
      // We don't fail the whole request, just return registrations without DU data if error
    }

    // 4. Filter and structure final response
    const allRegistrations = tikrarRegistrations
      .filter((reg: any) => {
        const batch = Array.isArray(reg.batch) ? reg.batch[0] : reg.batch;
        return batch?.status === 'open';
      })
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
      });

    // 5. Sort by recency
    allRegistrations.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || a.submitted_at || 0);
      const dateB = new Date(b.created_at || b.submitted_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return ApiResponses.success(allRegistrations);
  } catch (error) {
    console.error('[Pendaftaran My API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}
