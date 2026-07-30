import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const supabaseAdmin = createSupabaseAdmin();
    
    const { data: { user }, error: authError } = await (await supabase).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admins only' }, { status: 403 });
    }

    const body = await request.json();
    const { juz_number, question_package, is_active } = body;

    if (!juz_number || !question_package || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('exam_questions')
      .update({ is_active })
      .eq('juz_number', juz_number)
      .eq('question_package', question_package);

    if (updateError) {
      logger.error('Error updating archive status', { error: updateError });
      return NextResponse.json({ error: 'Failed to update archive status', details: updateError.message }, { status: 500 });
    }

    logger.info('Updated archive status for package', { juz_number, question_package, is_active, adminId: user.id });

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (error: any) {
    logger.error('Unhandled error in bulk-archive route', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
