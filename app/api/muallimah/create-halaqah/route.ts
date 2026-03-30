import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { requireAdmin, getAuthorizationContext } from '@/lib/rbac';
import { ApiResponses } from '@/lib/api-responses';

// Validation schema for creating halaqah
const createHalaqahSchema = z.object({
  name: z.string().min(1, 'Nama halaqah wajib diisi'),
  description: z.string().optional(),
  day_of_week: z.number().min(1).max(7).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  max_students: z.number().min(1).default(20),
  zoom_link: z.string().url().optional().or(z.literal('')),
  preferred_juz: z.string().optional(),
  waitlist_max: z.number().min(0).default(5),
  muallimah_id: z.string().optional(), // For admin to assign to specific muallimah
});

export async function POST(request: Request) {
  try {
    // 1. Authorization check - Standardized via requireAdmin
    const authError = await requireAdmin();
    if (authError) return authError;

    const context = await getAuthorizationContext();
    if (!context) return ApiResponses.unauthorized('Unable to get authorization context');

    const supabase = createClient();

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = createHalaqahSchema.safeParse(body);

    if (!validationResult.success) {
      return ApiResponses.validationError(validationResult.error.issues);
    }

    const data = validationResult.data;

    // Determine teacher (muallimah) ID:
    // - Admin can create for any user specified as teacher
    let targetMuallimahId = data.muallimah_id || context.userId;
    if (data.muallimah_id) {
      // Verify the target user exists
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.muallimah_id)
        .maybeSingle();

      if (!targetUser) {
        return ApiResponses.error('VALIDATION_ERROR', 'Target teacher user not found', {}, 400);
      }
      targetMuallimahId = data.muallimah_id;
    }

    // Get current active batch
    const { data: activeBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!activeBatch) {
      return ApiResponses.error('RESOURCE_NOT_FOUND', 'No active batch found', {}, 400);
    }

    // Create halaqah
    const { data: halaqah, error } = await supabase
      .from('halaqah')
      .insert({
        name: data.name,
        description: data.description || null,
        day_of_week: data.day_of_week || null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        location: data.location || null,
        max_students: data.max_students,
        zoom_link: data.zoom_link || null,
        muallimah_id: targetMuallimahId,
        preferred_juz: data.preferred_juz || null,
        waitlist_max: data.waitlist_max,
        status: 'active',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Create Halaqah API] Database error:', error);
      return ApiResponses.databaseError(error);
    }

    return ApiResponses.success(halaqah, 'Halaqah created successfully');
  } catch (error) {
    console.error('[Create Halaqah API] Unexpected error:', error);
    return ApiResponses.handleUnknown(error);
  }
}

