import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { ApiResponses } from '@/lib/api-responses';
import { programSchemas } from '@/lib/schemas';

const supabaseAdmin = createSupabaseAdmin();

/**
 * @deprecated GET method is deprecated.
 *
 * MIGRATION GUIDE:
 * Instead of fetching programs via API from client:
 * ❌ const { data } = await fetch('/api/program')
 *
 * Use Server Component:
 * ✅ async function MyServerComponent() {
 * ✅   const supabase = createClient()
 * ✅   const { data } = await supabase.from('programs').select('*, batch:batches(*)')
 * ✅   return <ClientComponent programs={data} />
 * ✅ }
 *
 * This endpoint is kept for backward compatibility only.
 * The POST method (create program) is NOT deprecated.
 */
export async function GET(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const supabase = supabaseAdmin;

    let query = supabase
      .from('programs')
      .select(`
        *,
        batch:batches (
          id,
          name,
          description,
          start_date,
          end_date,
          status,
          registration_start_date,
          registration_end_date,
          is_free,
          price,
          total_quota,
          duration_weeks
        )
      `);

    // Apply filters
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching programs:', error);
      return ApiResponses.serverError('Failed to fetch programs');
    }

    // Transform data to match frontend expectations
    // No transformation needed - return raw data so frontend can handle it
    return ApiResponses.success(data || [], 'Programs fetched successfully');
  } catch (error) {
    console.error('Error in programs GET:', error);
    return ApiResponses.serverError('Internal server error');
  }
}

// POST /api/program - Create new program
export async function POST(request: NextRequest) {
  try {
    // Temporarily disabled admin check for development
    // const authResult = await requireAdmin(request);
    // if (authResult instanceof NextResponse) {
    //   return authResult;
    // }
    const body = await request.json();

    // Validate request body
    const validation = programSchemas.create.safeParse(body);
    if (!validation.success) {
      return ApiResponses.validationError(validation.error.issues);
    }

    const validatedData = validation.data;

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from('programs')
      .insert({
        ...validatedData,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
      return ApiResponses.serverError('Failed to create program');
    }

    return ApiResponses.success(data, 'Program created successfully', 201);
  } catch (error) {
    console.error('Error in programs POST:', error);
    return ApiResponses.serverError('Internal server error');
  }
}