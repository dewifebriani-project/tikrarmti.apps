import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger-secure';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

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

    // Verify the token and confirm the email
    const { data, error } = await (supabase.auth as any).verifyOtp({
      token,
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
    logger.error('Error in email confirmation', {
      error: error as Error
    });

    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengkonfirmasi email' },
      { status: 500 }
    );
  }
}