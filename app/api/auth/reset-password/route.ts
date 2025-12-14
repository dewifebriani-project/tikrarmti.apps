import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json();

    if (!password || !token) {
      return NextResponse.json(
        { error: 'Password dan token diperlukan' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Exchange token for session and update password
    const { data, error } = await (supabase.auth as any).verifyOtp({
      token,
      type: 'recovery',
      password: password,
    });

    if (error) {
      logger.error('Password reset failed', {
        error: error.message,
        tokenStart: token.substring(0, 8) + '...'
      });

      return NextResponse.json(
        { error: 'Token reset password tidak valid atau telah kadaluarsa' },
        { status: 400 }
      );
    }

    logger.auth('Password reset successfully', data.user?.id);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    logger.error('Error in password reset', {
      error: error as Error
    });

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mereset password' },
      { status: 500 }
    );
  }
}