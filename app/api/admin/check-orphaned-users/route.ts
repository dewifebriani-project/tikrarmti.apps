// API Route: /api/admin/check-orphaned-users
// Find users that exist in Supabase Auth but not in users table or pendaftaran_tikrar_tahfidz

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get all users from Supabase Auth
    // Note: We need to use admin API to list all users
    const { data: { users }, error: listError } = await (supabaseAdmin as any).auth.admin.listUsers();

    if (listError) {
      logger.error('Error listing auth users', { error: listError });
      return NextResponse.json({ error: 'Failed to list auth users' }, { status: 500 });
    }

    // Get all user IDs from users table
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id');

    if (dbError) {
      logger.error('Error fetching db users', { error: dbError });
      return NextResponse.json({ error: 'Failed to fetch database users' }, { status: 500 });
    }

    const dbUserIds = new Set(dbUsers?.map(u => u.id) || []);

    // Get all user IDs from pendaftaran_tikrar_tahfidz
    const { data: pendaftaranUsers, error: pendaftaranError } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('user_id');

    if (pendaftaranError) {
      logger.error('Error fetching pendaftaran users', { error: pendaftaranError });
      return NextResponse.json({ error: 'Failed to fetch pendaftaran users' }, { status: 500 });
    }

    const pendaftaranUserIds = new Set(pendaftaranUsers?.map(p => p.user_id) || []);

    // Find orphaned users
    const orphanedAuth = []; // In auth but not in users table
    const orphanedPendaftaran = []; // In users but no pendaftaran
    const completeUsers = []; // Have both auth and pendaftaran

    for (const authUser of users) {
      const userId = authUser.id;
      const email = authUser.email;
      const createdAt = authUser.created_at;
      const lastSignIn = authUser.last_sign_in_at;
      const metadata = authUser.user_metadata;
      const confirmedAt = authUser.email_confirmed_at;

      // Check if in users table
      const inUsersTable = dbUserIds.has(userId);
      // Check if in pendaftaran table
      const inPendaftaran = pendaftaranUserIds.has(userId);

      if (!inUsersTable) {
        orphanedAuth.push({
          id: userId,
          email,
          created_at: createdAt,
          last_sign_in_at: lastSignIn,
          email_confirmed_at: confirmedAt,
          metadata,
          issue: 'NOT_IN_USERS_TABLE'
        });
      } else if (!inPendaftaran) {
        orphanedPendaftaran.push({
          id: userId,
          email,
          created_at: createdAt,
          last_sign_in_at: lastSignIn,
          email_confirmed_at: confirmedAt,
          metadata,
          issue: 'NOT_IN_PENDAFTARAN_TABLE'
        });
      } else {
        completeUsers.push({
          id: userId,
          email,
          created_at: createdAt,
          last_sign_in_at: lastSignIn
        });
      }
    }

    logger.info('Orphaned users check completed', {
      totalAuthUsers: users.length,
      orphanedAuth: orphanedAuth.length,
      orphanedPendaftaran: orphanedPendaftaran.length,
      completeUsers: completeUsers.length,
      adminId: user.id
    });

    return NextResponse.json({
      summary: {
        total_auth_users: users.length,
        orphaned_auth_users: orphanedAuth.length,
        orphaned_pendaftaran: orphanedPendaftaran.length,
        complete_users: completeUsers.length
      },
      orphaned_auth_users: orphanedAuth,
      orphaned_pendaftaran: orphanedPendaftaran,
      complete_users: completeUsers
    });

  } catch (error) {
    logger.error('Error in GET /api/admin/check-orphaned-users', { error: error as Error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
