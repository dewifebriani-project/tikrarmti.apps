import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { email, new_password } = await request.json();

    if (!email || !new_password) {
      return NextResponse.json(
        { error: 'Email dan password baru diperlukan' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Cari user di auth.users berdasarkan email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      logger.error('Failed to list users', { error: listError.message });
      return NextResponse.json(
        { error: 'Gagal memproses reset password' },
        { status: 500 }
      );
    }

    const targetUser = users.find(u => u.email === email.toLowerCase().trim());

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Email tidak terdaftar' },
        { status: 404 }
      );
    }

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: new_password }
    );

    if (updateError) {
      logger.error('Failed to update password', { error: updateError.message });
      return NextResponse.json(
        { error: 'Gagal mengupdate password' },
        { status: 500 }
      );
    }

    logger.info('Password reset successfully via OTP', {
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2')
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    });

  } catch (error) {
    logger.error('Error in reset-with-otp', { error });
    return NextResponse.json(
      { error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}
