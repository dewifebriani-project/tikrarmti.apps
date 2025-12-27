import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger-secure';

const supabaseAdmin = createSupabaseAdmin();

// Helper function to calculate age from birth date
function getYearFromBirthDate(birthDate: string | null): string {
  if (!birthDate) return '';
  try {
    const date = new Date(birthDate);
    const year = date.getFullYear();
    // Return last 2 digits of year
    return year.toString().slice(-2);
  } catch {
    return '';
  }
}

// Helper function to format text to Proper Case (capitalize first letter of each word)
function toProperCase(text: string | null): string {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Helper function to format contact name
function formatContactName(fullName: string, birthDate: string | null, city: string | null): string {
  const yearYY = getYearFromBirthDate(birthDate);
  const formattedCity = toProperCase(city);
  const formattedName = toProperCase(fullName);

  let name = `MTI ${formattedName}`;

  if (yearYY) {
    name += ` ${yearYY}`;
  }

  if (formattedCity) {
    name += ` ${formattedCity}`;
  }

  return name;
}

// Helper function to normalize phone number (remove +, spaces, dashes)
function normalizePhoneNumber(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\+]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    // Use Supabase SSR client to get session
    const supabase = createServerClient();

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
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

    logger.info('Admin exporting contacts', { adminId: user.id });

    // Fetch all users with phone numbers using admin client
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        full_name,
        email,
        whatsapp,
        telegram,
        tanggal_lahir,
        kota
      `)
      .not('whatsapp', 'is', null)
      .order('full_name', { ascending: true });

    if (fetchError) {
      logger.error('Error fetching users for contact export', { error: fetchError });
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users with phone numbers found' }, { status: 404 });
    }

    // Build CSV content compatible with Google Contacts
    // Gmail CSV format: Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,Phone 1 - Type,Phone 1 - Value

    const csvHeaders = [
      'Name',
      'Given Name',
      'Family Name',
      'Email 1 - Type',
      'Email 1 - Value',
      'Phone 1 - Type',
      'Phone 1 - Value',
      'Phone 2 - Type',
      'Phone 2 - Value',
      'Organization 1 - Name',
      'Notes'
    ];

    const csvRows: string[] = [csvHeaders.join(',')];

    // Escape CSV fields (handle commas and quotes)
    const escapeCsvField = (field: string | null): string => {
      if (!field) return '';
      const str = field.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    for (const user of users) {
      // Format contact name with Proper Case (MTI Dewi Febriani 95 Jakarta)
      const fullContactName = formatContactName(
        user.full_name || 'Unknown',
        user.tanggal_lahir,
        user.kota
      );

      // Build CSV row
      // Gmail uses "Given Name" as the primary display name, so put the full formatted name there
      const row = [
        escapeCsvField(fullContactName), // Name - for display
        escapeCsvField(fullContactName), // Given Name - THIS is what Gmail uses as contact name
        escapeCsvField(''), // Family Name
        'Work', // Email 1 - Type
        escapeCsvField(user.email), // Email 1 - Value
        'Mobile', // Phone 1 - Type
        escapeCsvField(user.whatsapp), // Phone 1 - Value
        user.telegram ? 'Other' : '', // Phone 2 - Type
        escapeCsvField(user.telegram || ''), // Phone 2 - Value
        'Markaz Tikrar Indonesia', // Organization 1 - Name
        escapeCsvField(`ID: ${user.id}`) // Notes
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    logger.info('Contacts exported successfully', {
      adminId: user.id,
      totalUsers: users.length,
      exportedContacts: csvRows.length - 1
    });

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mti-contacts-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    logger.error('Error in export contacts', { error: error as Error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
