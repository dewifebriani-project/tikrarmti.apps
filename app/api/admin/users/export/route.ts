import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { cookies } from 'next/headers';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies (same as middleware)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const accessTokenCookie = allCookies.find(c => c.name === 'sb-access-token');
    const refreshTokenCookie = allCookies.find(c => c.name === 'sb-refresh-token');
    const accessToken = accessTokenCookie?.value;
    const refreshToken = refreshTokenCookie?.value;

    // Also try to get from Authorization header as fallback
    const authHeader = request.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '');

    const tokenToUse = accessToken || headerToken;

    if (!tokenToUse) {
      console.error('No access token found in cookies or headers');
      return NextResponse.json({
        error: 'Unauthorized - No token. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Create Supabase client and set session from cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Set the session using the tokens from cookies or header
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: tokenToUse,
      refresh_token: refreshToken || ''
    });

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    const user = session.user;
    if (!user) {
      console.error('No user in session');
      return NextResponse.json({
        error: 'Unauthorized - No user. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', userError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all users with full data (similar to register form fields)
    // Use admin client to bypass RLS
    console.log('Starting users data fetch for export at', new Date().toISOString());
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        is_active,
        created_at,
        provinsi,
        kota,
        alamat,
        whatsapp,
        telegram,
        updated_at
      `)
      .order('created_at', { ascending: false });

    console.log('Users data fetch completed at', new Date().toISOString());
    console.log('Total users found:', users?.length || 0);

    if (error) {
      console.error('Error fetching users for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users data' },
        { status: 500 }
      );
    }

    // Transform data for Excel export
    const exportData = users?.map(user => ({
      ID: user.id,
      Email: user.email || '',
      'Nama Lengkap': user.full_name || '',
      'No. HP': user.phone || '',
      Role: user.role || '',
      Status: user.is_active ? 'Active' : 'Inactive',
      Provinsi: user.provinsi || '',
      Kota: user.kota || '',
      Alamat: user.alamat || '',
      WhatsApp: user.whatsapp || '',
      Telegram: user.telegram || '',
      'Tanggal Dibuat': user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '',
      'Tanggal Diupdate': user.updated_at ? new Date(user.updated_at).toLocaleString('id-ID') : ''
    })) || [];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // ID
      { wch: 30 }, // Email
      { wch: 25 }, // Nama Lengkap
      { wch: 15 }, // No. HP
      { wch: 15 }, // Role
      { wch: 10 }, // Status
      { wch: 20 }, // Provinsi
      { wch: 20 }, // Kota
      { wch: 40 }, // Alamat
      { wch: 15 }, // WhatsApp
      { wch: 15 }, // Telegram
      { wch: 25 }, // Tanggal Dibuat
      { wch: 25 }  // Tanggal Diupdate
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Users Data');

    // Generate buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `users_export_${timestamp}.xlsx`;

    // Return file response
    return new NextResponse(excelBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in users export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}