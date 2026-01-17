// API Route: /api/admin/sync-orphaned-user
// Sync a single orphaned auth user to the database

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !userData.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get auth user details
    const { data: { users }, error: listError } = await (supabaseAdmin as any).auth.admin.listUsers();

    if (listError) {
      logger.error('Error listing auth users', { error: listError });
      return NextResponse.json({ error: 'Failed to list auth users' }, { status: 500 });
    }

    const authUser = users.find((u: any) => u.id === userId);

    if (!authUser) {
      return NextResponse.json({ error: 'Auth user not found' }, { status: 404 });
    }

    // Check if user already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (action === 'create_users_record') {
      if (existingUser) {
        return NextResponse.json({ error: 'User record already exists in users table' }, { status: 400 });
      }

      // Create user record from auth metadata
      const metadata = authUser.user_metadata || {};
      const newUserRecord = {
        id: userId,
        email: authUser.email,
        full_name: metadata.full_name || metadata.name || '',
        phone: metadata.phone || '',
        role: 'thalibah', // Default role
        created_at: new Date(authUser.created_at).toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert(newUserRecord)
        .select()
        .single();

      if (createError) {
        logger.error('Error creating user record', { error: createError, userId });
        return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
      }

      logger.info('User record created for orphaned auth user', { userId, email: authUser.email, adminId: user.id });

      return NextResponse.json({
        message: 'User record created successfully',
        user: createdUser
      });

    } else if (action === 'delete_auth_user') {
      // Delete the auth user
      const { error: deleteError } = await (supabaseAdmin as any).auth.admin.deleteUser(userId);

      if (deleteError) {
        logger.error('Error deleting auth user', { error: deleteError, userId });
        return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
      }

      logger.info('Auth user deleted', { userId, email: authUser.email, adminId: user.id });

      return NextResponse.json({
        message: 'Auth user deleted successfully'
      });

    } else {
      return NextResponse.json({ error: 'Invalid action. Use: create_users_record or delete_auth_user' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error in POST /api/admin/sync-orphaned-user', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
