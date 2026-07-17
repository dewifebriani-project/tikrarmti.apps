import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/fix-mujiani-email
 * Task 1: Set Mujiani's email to anijiee82@gmail.com
 * Task 2: Remove tikrararbain@gmail from Mujiani
 */
export async function GET() {
  const supabase = createSupabaseAdmin();
  const results: any[] = [];

  try {
    // Step 1: Find Mujiani by name in public.users
    const { data: usersFound, error: findError } = await supabase
      .from('users')
      .select('id, email, full_name, roles')
      .or('full_name.ilike.%mujiani%,email.ilike.%tikrararbain%,email.ilike.%anijiee%');

    if (findError) {
      return NextResponse.json({ error: 'Error finding users: ' + findError.message }, { status: 500 });
    }

    results.push({ step: 'find_in_users', found: usersFound });

    if (!usersFound || usersFound.length === 0) {
      return NextResponse.json({ 
        message: 'No matching user found. Try broader search.',
        results 
      });
    }

    // Find the Mujiani user specifically (prefer tikrararbain or mujiani in name)
    const mujiani = usersFound.find((u: any) => 
      u.full_name?.toLowerCase().includes('mujiani') ||
      u.email?.toLowerCase().includes('tikrararbain')
    ) || usersFound[0];

    results.push({ step: 'identified_mujiani', user: mujiani });

    const targetEmail = 'anijiee82@gmail.com';

    if (mujiani.email === targetEmail) {
      return NextResponse.json({ 
        message: 'Email sudah benar: ' + targetEmail,
        results
      });
    }

    // Step 2: Update email in auth.users via Admin API
    const { data: authUpdate, error: authError } = await supabase.auth.admin.updateUserById(
      mujiani.id,
      { email: targetEmail, email_confirm: true }
    );

    results.push({ step: 'update_auth_email', success: !authError, error: authError?.message, data: authUpdate?.user?.email });

    if (authError) {
      return NextResponse.json({ 
        error: 'Failed to update auth email: ' + authError.message,
        results
      }, { status: 500 });
    }

    // Step 3: Update email in public.users
    const { data: publicUpdate, error: publicError } = await supabase
      .from('users')
      .update({ email: targetEmail, updated_at: new Date().toISOString() })
      .eq('id', mujiani.id)
      .select();

    results.push({ step: 'update_public_users', success: !publicError, error: publicError?.message, data: publicUpdate });

    if (publicError) {
      return NextResponse.json({ 
        error: 'Auth updated but public.users failed: ' + publicError.message,
        results
      }, { status: 500 });
    }

    // Step 4: Verify tikrararbain is gone
    const { data: verifyGone, error: verifyError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .ilike('email', '%tikrararbain%');

    results.push({ step: 'verify_tikrararbain_gone', remaining: verifyGone?.length ?? 0, records: verifyGone });

    return NextResponse.json({ 
      success: true,
      message: `Email Mujiani berhasil diupdate ke ${targetEmail}`,
      oldEmail: mujiani.email,
      newEmail: targetEmail,
      tikrararbainRemaining: verifyGone?.length ?? 0,
      results
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      results 
    }, { status: 500 });
  }
}
