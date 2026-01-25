import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token) {
      return NextResponse.json(
        { error: 'Token konfirmasi diperlukan' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Handle password recovery
    if (type === 'recovery') {
      logger.info('Password recovery token verification', {
        tokenStart: token.substring(0, 8) + '...'
      });

      // Verify OTP for recovery
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });

      if (error) {
        logger.error('Recovery token verification failed', {
          error: error.message,
          tokenStart: token.substring(0, 8) + '...'
        });

        return NextResponse.json(
          { error: 'Link reset password tidak valid atau sudah kadaluarsa' },
          { status: 400 }
        );
      }

      logger.auth('Recovery token verified successfully', data.user?.id);

      return NextResponse.json({
        success: true,
        message: 'Token recovery valid'
      });
    }

    // Verify the token and confirm the email (signup)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    });

    if (error) {
      logger.error('Email confirmation failed', {
        error: error.message,
        tokenStart: token.substring(0, 8) + '...'
      });

      return NextResponse.json(
        { error: 'Token konfirmasi tidak valid atau telah kadaluarsa' },
        { status: 400 }
      );
    }

    logger.auth('Email confirmed successfully', data.user?.id);

    return NextResponse.json({
      success: true,
      message: 'Email berhasil dikonfirmasi'
    });

  } catch (error) {
    logger.error('Error in confirmation', {
      error: error as Error
    });

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat konfirmasi' },
      { status: 500 }
    );
  }
}