import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';

const supabaseAdmin = createSupabaseAdmin();

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Check if user is admin using admin client
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      console.error('Admin check failed:', dbError, userData);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get all users with full data (similar to register form fields)
    // Use admin client to bypass RLS
    console.log('Starting users data fetch for export at', new Date().toISOString());

    // Try to get users data with error handling for missing columns
    // First, try with extended fields
    let users: any[] | null = null;
    let error: any = null;

    try {
      const result = await supabaseAdmin
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          updated_at,
          provinsi,
          kota,
          alamat,
          whatsapp,
          telegram,
          tanggal_lahir,
          tempat_lahir,
          pekerjaan,
          alasan_daftar,
          jenis_kelamin,
          negara,
          zona_waktu
        `)
        .order('created_at', { ascending: false });

      users = result.data;
      error = result.error;
    } catch (err: any) {
      console.error('Error fetching with extended fields:', err);
      error = err;
    }

    console.log('Users data fetch completed at', new Date().toISOString());
    console.log('Total users found:', users?.length || 0);

    if (error) {
      console.error('Error fetching users for export:', error);

      // If column doesn't exist error, try with basic columns only
      if (error.message?.includes('column') || error.code === 'PGRST116') {
        console.log('Retrying with basic columns only...');
        const { data: usersSimple, error: errorSimple } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        if (errorSimple) {
          console.error('Error fetching users (basic):', errorSimple);
          return NextResponse.json(
            {
              error: 'Failed to fetch users data',
              details: errorSimple.message,
              code: errorSimple.code
            },
            { status: 500 }
          );
        }

        // Transform data for Excel export (basic columns only)
        const exportData = usersSimple?.map(user => ({
          ID: user.id,
          Email: user.email || '',
          'Nama Lengkap': user.full_name || '',
          Role: user.role || '',
          Status: user.is_active ? 'Active' : 'Inactive',
          'Tanggal Dibuat': user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '',
          'Tanggal Diupdate': user.updated_at ? new Date(user.updated_at).toLocaleString('id-ID') : ''
        })) || [];

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths for basic data
        const colWidths = [
          { wch: 36 }, // ID
          { wch: 30 }, // Email
          { wch: 25 }, // Nama Lengkap
          { wch: 15 }, // Role
          { wch: 10 }, // Status
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

        console.log('Export successful with basic columns. Total users:', usersSimple?.length);

        // Return file response
        return new NextResponse(excelBuffer as ArrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch users data',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // Transform data for Excel export with all available fields
    const exportData = users?.map((user: any) => ({
      ID: user.id,
      Email: user.email || '',
      'Nama Lengkap': user.full_name || '',
      Role: user.role || '',
      Status: user.is_active ? 'Active' : 'Inactive',
      'Tanggal Lahir': user.tanggal_lahir || '',
      'Tempat Lahir': user.tempat_lahir || '',
      'Jenis Kelamin': user.jenis_kelamin || '',
      Negara: user.negara || '',
      Provinsi: user.provinsi || '',
      Kota: user.kota || '',
      Alamat: user.alamat || '',
      WhatsApp: user.whatsapp || '',
      Telegram: user.telegram || '',
      'Zona Waktu': user.zona_waktu || '',
      Pekerjaan: user.pekerjaan || '',
      'Alasan Daftar': user.alasan_daftar || '',
      'Tanggal Dibuat': user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : '',
      'Tanggal Diupdate': user.updated_at ? new Date(user.updated_at).toLocaleString('id-ID') : ''
    })) || [];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for all fields
    const colWidths = [
      { wch: 36 }, // ID
      { wch: 30 }, // Email
      { wch: 25 }, // Nama Lengkap
      { wch: 15 }, // Role
      { wch: 10 }, // Status
      { wch: 15 }, // Tanggal Lahir
      { wch: 20 }, // Tempat Lahir
      { wch: 15 }, // Jenis Kelamin
      { wch: 15 }, // Negara
      { wch: 20 }, // Provinsi
      { wch: 20 }, // Kota
      { wch: 40 }, // Alamat
      { wch: 15 }, // WhatsApp
      { wch: 15 }, // Telegram
      { wch: 15 }, // Zona Waktu
      { wch: 20 }, // Pekerjaan
      { wch: 40 }, // Alasan Daftar
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