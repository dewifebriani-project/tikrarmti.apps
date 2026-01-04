import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, getUserAgent, logAudit } from '@/lib/audit-log';

const supabaseAdmin = createSupabaseAdmin();

/**
 * POST /api/admin/halaqah/assign-thalibah
 *
 * Assign selected thalibah to appropriate halaqah based on:
 * 1. Juz number matching between thalibah and muallimah
 * 2. Class type requirements (ujian only, tashih only, or both)
 * 3. Available capacity in halaqah
 *
 * If class_type is 'tashih_ujian', one halaqah covers both requirements.
 * Otherwise, thalibah needs separate assignment for ujian and tashih.
 *
 * Smart assign with fallback - auto-assignes but allows manual override.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Invalid session. Please login again.',
        needsLogin: true
      }, { status: 401 });
    }

    // Admin check
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (dbError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { thalibah_ids, batch_id, manual_assignments } = body;

    // Validate required fields
    if (!thalibah_ids || !Array.isArray(thalibah_ids) || thalibah_ids.length === 0) {
      return NextResponse.json(
        { error: 'thalibah_ids is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    console.log('[Assign Thalibah] Starting assignment for', thalibah_ids.length, 'thalibahs');

    // Get the batch details to find programs
    const { data: batch } = await supabaseAdmin
      .from('batches')
      .select('id, name')
      .eq('id', batch_id)
      .single();

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get all programs for this batch
    const { data: programs } = await supabaseAdmin
      .from('programs')
      .select('id, name, class_type')
      .eq('batch_id', batch_id);

    if (!programs || programs.length === 0) {
      return NextResponse.json(
        { error: 'No programs found for this batch' },
        { status: 404 }
      );
    }

    const programMap = new Map(programs.map(p => [p.id, p]));

    // Get all halaqahs for this batch's programs
    const { data: halaqahs } = await supabaseAdmin
      .from('halaqah')
      .select('id, program_id, muallimah_id, preferred_juz, max_students, status')
      .in('program_id', Array.from(programMap.keys()))
      .eq('status', 'active');

    if (!halaqahs || halaqahs.length === 0) {
      return NextResponse.json(
        { error: 'No active halaqahs found for this batch' },
        { status: 404 }
      );
    }

    // Get current student counts for all halaqahs
    const halaqahIds = halaqahs.map(h => h.id);
    const { data: studentCounts } = await supabaseAdmin
      .from('halaqah_students')
      .select('halaqah_id')
      .in('halaqah_id', halaqahIds)
      .eq('status', 'active');

    // Count students per halaqah
    const studentCountMap = new Map<string, number>();
    for (const halaqahId of halaqahIds) {
      studentCountMap.set(halaqahId, 0);
    }
    for (const student of studentCounts || []) {
      const current = studentCountMap.get(student.halaqah_id) || 0;
      studentCountMap.set(student.halaqah_id, current + 1);
    }

    // Add _count to each halaqah
    const halaqahsWithCounts = halaqahs.map(h => ({
      ...h,
      _count: {
        students: studentCountMap.get(h.id) || 0
      }
    }));

    // Get muallimah data for all halaqahs
    const muallimahIds = halaqahs.map(h => h.muallimah_id).filter(Boolean) as string[];
    const { data: muallimahRegs } = await supabaseAdmin
      .from('muallimah_registrations')
      .select('user_id, preferred_juz, class_type')
      .in('user_id', muallimahIds)
      .eq('status', 'approved');

    const muallimahMap = new Map(
      muallimahRegs?.map(m => [m.user_id, m]) || []
    );

    // Get thalibah data with their chosen_juz
    const { data: thalibahData } = await supabaseAdmin
      .from('pendaftaran_tikrar_tahfidz')
      .select('id, user_id, full_name, chosen_juz, selection_status')
      .in('id', thalibah_ids);

    if (!thalibahData || thalibahData.length === 0) {
      return NextResponse.json(
        { error: 'No valid thalibah registrations found' },
        { status: 404 }
      );
    }

    // Track assignment results
    const results: {
      success: any[];
      partial: any[];
      failed: any[];
      skipped: any[];
    } = {
      success: [],
      partial: [],
      failed: [],
      skipped: []
    };

    // Process each thalibah
    for (const thalibah of thalibahData) {
      if (thalibah.selection_status !== 'selected') {
        results.skipped.push({
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          reason: `Not selected (status: ${thalibah.selection_status})`
        });
        continue;
      }

      // Parse chosen_juz to get juz number (e.g., "28", "29", "30")
      const thalibahJuz = parseInt(thalibah.chosen_juz);
      if (isNaN(thalibahJuz)) {
        results.failed.push({
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          reason: 'Invalid chosen_juz'
        });
        continue;
      }

      console.log('[Assign Thalibah] Processing', thalibah.full_name, 'Juz', thalibahJuz);

      // Check for manual assignment if provided
      let manualAssignment = manual_assignments?.find((m: any) => m.thalibah_id === thalibah.id);

      if (manualAssignment) {
        // Manual assignment - use specified halaqahs
        const assignmentResult = await assignToSpecificHalaqah(
          thalibah,
          manualAssignment,
          programMap,
          user.id
        );
        if (assignmentResult.success) {
          results.success.push(assignmentResult.data);
        } else if (assignmentResult.partial) {
          results.partial.push(assignmentResult.data);
        } else {
          results.failed.push(assignmentResult.data);
        }
      } else {
        // Smart auto-assignment
        const assignmentResult = await smartAssignThalibah(
          thalibah,
          thalibahJuz,
          halaqahsWithCounts,
          muallimahMap,
          programMap,
          user.id
        );
        if (assignmentResult.success) {
          results.success.push(assignmentResult.data);
        } else if (assignmentResult.partial) {
          results.partial.push(assignmentResult.data);
        } else {
          results.failed.push(assignmentResult.data);
        }
      }
    }

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      resource: 'halaqah_students',
      details: {
        batch_id,
        total_thalibah: thalibah_ids.length,
        successful: results.success.length,
        partial: results.partial.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      level: 'INFO'
    });

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error: any) {
    console.error('[Assign Thalibah] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Smart assign thalibah to appropriate halaqahs based on juz matching and class type
 */
async function smartAssignThalibah(
  thalibah: any,
  thalibahJuz: number,
  halaqahs: any[],
  muallimahMap: Map<string, any>,
  programMap: Map<string, any>,
  adminId: string
) {
  // Find matching halaqahs based on juz
  const matchingHalaqahs = halaqahs.filter(h => {
    const muallimah = h.muallimah_id ? muallimahMap.get(h.muallimah_id) : null;
    if (!muallimah) return false;

    // Parse muallimah preferred_juz (could be single juz or comma-separated)
    const muallimahJuzList = muallimah.preferred_juz
      ?.split(',')
      .map((j: string) => parseInt(j.trim()))
      .filter((j: number) => !isNaN(j)) || [];

    return muallimahJuzList.includes(thalibahJuz);
  });

  if (matchingHalaqahs.length === 0) {
    return {
      success: false,
      partial: false,
      data: {
        thalibah_id: thalibah.id,
        name: thalibah.full_name,
        reason: `No halaqah found for Juz ${thalibahJuz}`
      }
    };
  }

  // Group by class type
  const halaqahsByClassType = new Map<string, any[]>();
  for (const h of matchingHalaqahs) {
    const program = programMap.get(h.program_id);
    if (!program) continue;

    const classType = program.class_type || 'unknown';
    if (!halaqahsByClassType.has(classType)) {
      halaqahsByClassType.set(classType, []);
    }
    halaqahsByClassType.get(classType)!.push(h);
  }

  const assignments: any[] = [];
  let hasTashihUjian = false;
  let hasUjian = false;
  let hasTashih = false;

  // Check what class types are available
  if (halaqahsByClassType.has('tashih_ujian')) {
    hasTashihUjian = true;
  }
  if (halaqahsByClassType.has('ujian_only')) {
    hasUjian = true;
  }
  if (halaqahsByClassType.has('tashih_only')) {
    hasTashih = true;
  }

  // If tashih_ujian is available, assign there (covers both requirements)
  if (hasTashihUjian) {
    const tashihUjianHalaqahs = halaqahsByClassType.get('tashih_ujian')!;
    const availableHalaqah = findAvailableHalaqah(tashihUjianHalaqahs);

    if (availableHalaqah) {
      const result = await assignThalibahToHalaqah(thalibah.id, availableHalaqah.id, adminId);
      if (result.success) {
        assignments.push({
          halaqah_id: availableHalaqah.id,
          class_type: 'tashih_ujian',
          covers: ['ujian', 'tashih']
        });
      }
    } else {
      return {
        success: false,
        partial: false,
        data: {
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          reason: 'No available capacity in tashih_ujian halaqah'
        }
      };
    }
  } else {
    // Need separate assignments for ujian and tashih
    let assignedUjian = false;
    let assignedTashih = false;

    if (hasUjian) {
      const ujianHalaqahs = halaqahsByClassType.get('ujian_only')!;
      const availableHalaqah = findAvailableHalaqah(ujianHalaqahs);

      if (availableHalaqah) {
        const result = await assignThalibahToHalaqah(thalibah.id, availableHalaqah.id, adminId);
        if (result.success) {
          assignments.push({
            halaqah_id: availableHalaqah.id,
            class_type: 'ujian_only',
            covers: ['ujian']
          });
          assignedUjian = true;
        }
      }
    }

    if (hasTashih) {
      const tashihHalaqahs = halaqahsByClassType.get('tashih_only')!;
      const availableHalaqah = findAvailableHalaqah(tashihHalaqahs);

      if (availableHalaqah) {
        const result = await assignThalibahToHalaqah(thalibah.id, availableHalaqah.id, adminId);
        if (result.success) {
          assignments.push({
            halaqah_id: availableHalaqah.id,
            class_type: 'tashih_only',
            covers: ['tashih']
          });
          assignedTashih = true;
        }
      }
    }

    // Check if both assignments were made
    if (assignedUjian && assignedTashih) {
      return {
        success: true,
        data: {
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          assignments
        }
      };
    } else if (assignedUjian || assignedTashih) {
      return {
        success: false,
        partial: true,
        data: {
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          reason: assignedUjian ? 'No available tashih class' : 'No available ujian class',
          assignments
        }
      };
    } else {
      return {
        success: false,
        partial: false,
        data: {
          thalibah_id: thalibah.id,
          name: thalibah.full_name,
          reason: 'No available capacity in ujian or tashih halaqahs'
        }
      };
    }
  }

  if (assignments.length > 0) {
    return {
      success: true,
      data: {
        thalibah_id: thalibah.id,
        name: thalibah.full_name,
        assignments
      }
    };
  }

  return {
    success: false,
    partial: false,
    data: {
      thalibah_id: thalibah.id,
      name: thalibah.full_name,
      reason: 'Failed to assign to any halaqah'
    }
  };
}

/**
 * Assign thalibah to specific halaqahs (manual override)
 */
async function assignToSpecificHalaqah(
  thalibah: any,
  manualAssignment: any,
  programMap: Map<string, any>,
  adminId: string
) {
  const assignments: any[] = [];
  let successCount = 0;
  const requiredHalaqahs = manualAssignment.halaqah_ids || [];

  for (const halaqahId of requiredHalaqahs) {
    const result = await assignThalibahToHalaqah(thalibah.id, halaqahId, adminId);
    if (result.success) {
      const program = programMap.get(result.halaqah?.program_id);
      assignments.push({
        halaqah_id: halaqahId,
        class_type: program?.class_type,
        covers: [program?.class_type]
      });
      successCount++;
    }
  }

  if (successCount === requiredHalaqahs.length) {
    return {
      success: true,
      data: {
        thalibah_id: thalibah.id,
        name: thalibah.full_name,
        assignments
      }
    };
  } else if (successCount > 0) {
    return {
      success: false,
      partial: true,
      data: {
        thalibah_id: thalibah.id,
        name: thalibah.full_name,
        reason: `Only ${successCount}/${requiredHalaqahs.length} halaqahs assigned successfully`,
        assignments
      }
    };
  } else {
    return {
      success: false,
      partial: false,
      data: {
        thalibah_id: thalibah.id,
        name: thalibah.full_name,
        reason: 'Failed to assign to any specified halaqah'
      }
    };
  }
}

/**
 * Find halaqah with available capacity
 */
function findAvailableHalaqah(halaqahs: any[]): any | null {
  // Find halaqah with space (prefer less full ones for load balancing)
  const availableHalaqahs = halaqahs.filter(h => {
    const currentStudents = h._count?.students || 0;
    const maxStudents = h.max_students || 20;
    return currentStudents < maxStudents;
  });

  if (availableHalaqahs.length === 0) {
    return null;
  }

  // Sort by current students (ascending) to distribute load
  availableHalaqahs.sort((a, b) => {
    const aStudents = a._count?.students || 0;
    const bStudents = b._count?.students || 0;
    return aStudents - bStudents;
  });

  return availableHalaqahs[0];
}

/**
 * Perform the actual assignment to halaqah
 */
async function assignThalibahToHalaqah(
  thalibahId: string,
  halaqahId: string,
  adminId: string
) {
  try {
    // Check if already assigned
    const { data: existing } = await supabaseAdmin
      .from('halaqah_students')
      .select('*')
      .eq('halaqah_id', halaqahId)
      .eq('thalibah_id', thalibahId)
      .single();

    if (existing) {
      return {
        success: false,
        halaqah: existing,
        reason: 'Already assigned to this halaqah'
      };
    }

    // Create assignment
    const { data, error } = await supabaseAdmin
      .from('halaqah_students')
      .insert({
        halaqah_id: halaqahId,
        thalibah_id: thalibahId,
        assigned_by: adminId,
        status: 'active',
        enrollment_type: 'new'
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
