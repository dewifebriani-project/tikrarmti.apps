import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
