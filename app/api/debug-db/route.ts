import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test basic database connection
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env_vars: {
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'not set',
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'not set',
        supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message
      },
      { status: 500 }
    );
  }
}