import * as fs from 'fs';
const path = 'app/(protected)/admin/halaqah/actions.ts';
let content = fs.readFileSync(path, 'utf-8');

const newCode = `export async function autoCreateSimpleHalaqah(params: AutoCreateSimpleParams) {
  try {
    // CRITICAL: Verify admin role first
    const { user, supabaseAdmin } = await verifyAdmin()

    const { batch_id } = params

    if (!batch_id) {
      return {
        success: false,
        error: 'Missing required field: batch_id'
      }
    }

    console.log('[autoCreateSimpleHalaqah] Starting auto-create for batch:', batch_id)

    // Get all approved and NOT EXCLUDED muallimah for this batch
    const { data: muallimahs, error: muallimaError } = await supabaseAdmin
      .from('muallimah_akads')
      .select('*, user:users!muallimah_akads_user_id_fkey(full_name)')
      .eq('batch_id', batch_id)
      .eq('status', 'approved')
      .eq('exclude_from_capacity', false)

    if (muallimaError) {
      console.error('[autoCreateSimpleHalaqah] Error fetching muallimah:', muallimaError)
      return {
        success: false,
        error: 'Failed to fetch muallimah data'
      }
    }

    if (!muallimahs || muallimahs.length === 0) {
      console.log('[autoCreateSimpleHalaqah] No approved/valid muallimah found')
      return {
        success: true,
        created: 0,
        skipped: 0,
        message: 'No valid muallimah found for this batch'
      }
    }

    // Load programs for this batch to get their IDs
    const { data: programsList } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('batch_id', batch_id)

    const programsMap: Record<string, any> = {}
    programsList?.forEach(p => {
      const pName = p.name.toLowerCase()
      if (pName.includes('tahfidz tikrar')) programsMap['tikrar_tahfidz'] = p
      else if (pName.includes('pra-tikrar') || pName.includes('pra tikrar') || pName.includes('pra_tahfidz')) programsMap['pra_tahfidz'] = p
    })

    const mapDayToNumber = (dayStr: string): number | null => {
      if (!dayStr) return null;
      const d = dayStr.toLowerCase().trim();
      if (d.includes('senin')) return 1;
      if (d.includes('selasa')) return 2;
      if (d.includes('rabu')) return 3;
      if (d.includes('kamis')) return 4;
      if (d.includes('jumat') || d.includes("jum'at")) return 5;
      if (d.includes('sabtu')) return 6;
      if (d.includes('ahad') || d.includes('minggu')) return 7;
      return null;
    };

    let created = 0
    let skipped = 0
    const details: string[] = []

    for (const muallimah of muallimahs) {
      const fullName = muallimah.user?.full_name || 'Ustadzah'
      
      try {
        if (!muallimah.class_type) {
          details.push(\`✗ \${fullName}: class_type is empty\`)
          skipped++
          continue
        }

        const classTypes = muallimah.class_type.split(',').map((t: string) => t.trim())
        
        let schedulesJson: any = null;
        try {
          schedulesJson = typeof muallimah.preferred_schedule === 'string' 
            ? JSON.parse(muallimah.preferred_schedule) 
            : muallimah.preferred_schedule;
        } catch (e) {
          details.push(\`✗ \${fullName}: Invalid schedule JSON\`)
          skipped++
          continue
        }

        for (const type of classTypes) {
          const program = programsMap[type]
          if (!program) {
            details.push(\`✗ \${fullName}: Program not found in batch for type \${type}\`)
            skipped++
            continue
          }

          const scheduleKey = type === 'tikrar_tahfidz' ? 'tikrar' : 'pra_tahfidz'
          const schedule = schedulesJson?.[scheduleKey]
          
          if (!schedule || !schedule.day || !schedule.time_start || !schedule.time_end) {
            details.push(\`✗ \${fullName}: Missing schedule for \${type}\`)
            skipped++
            continue
          }

          const dayNum = mapDayToNumber(schedule.day)

          // Check if halaqah already exists for this muallimah and program
          const { data: existingHalaqahs } = await supabaseAdmin
            .from('halaqah')
            .select('id')
            .eq('muallimah_id', muallimah.user_id)
            .eq('program_id', program.id)

          if (existingHalaqahs && existingHalaqahs.length > 0) {
            details.push(\`⚠️ Halaqah already exists for \${fullName} (\${program.name})\`)
            skipped++
            continue
          }

          let cleanName = fullName
          if (cleanName.toLowerCase().startsWith('halaqah ')) cleanName = cleanName.substring(8)
          else if (cleanName.toLowerCase().startsWith('halaqah')) cleanName = cleanName.substring(7)
          if (cleanName.toLowerCase().startsWith('ustadzah ')) cleanName = cleanName.substring(9)
          else if (cleanName.toLowerCase().startsWith('ustadzah')) cleanName = cleanName.substring(8)
          cleanName = cleanName.trim()

          const halaqahName = \`\${program.name} - Juz \${muallimah.preferred_juz} - \${cleanName}\`

          const { data: newHalaqah, error: createError } = await supabaseAdmin
            .from('halaqah')
            .insert({
              program_id: program.id,
              muallimah_id: muallimah.user_id,
              name: halaqahName,
              description: \`Halaqah diampu oleh \${fullName}\`,
              day_of_week: dayNum,
              start_time: schedule.time_start,
              end_time: schedule.time_end,
              max_students: muallimah.preferred_max_thalibah || 20,
              waitlist_max: 5,
              preferred_juz: muallimah.preferred_juz,
              status: 'active',
            })
            .select()
            .single()

          if (createError) {
            details.push(\`✗ Failed to create halaqah for \${fullName} (\${program.name}): \${createError.message}\`)
            skipped++
            continue
          }

          const { error: mentorError } = await supabaseAdmin
            .from('halaqah_mentors')
            .insert({
              halaqah_id: newHalaqah.id,
              mentor_id: muallimah.user_id,
              role: 'ustadzah',
              is_primary: true,
            })

          if (mentorError) console.error('[autoCreateSimpleHalaqah] Error adding mentor:', mentorError)

          details.push(\`✓ Created \${program.name} for \${fullName}\`)
          created++
        }
      } catch (error: any) {
        details.push(\`✗ Failed processing \${fullName}: \${error.message}\`)
        skipped++
      }
    }

    const { ip, userAgent } = getRequestInfo()
    await logAudit({
      userId: user.id,
      action: 'CREATE',
      resource: 'halaqah',
      details: { batch_id, created, skipped, total_muallimah: muallimahs.length },
      ipAddress: ip,
      userAgent: userAgent,
      level: 'INFO'
    })

    revalidatePath('/admin/halaqah')

    return { success: true, created, skipped, details }
  } catch (error: any) {
    console.error('[autoCreateSimpleHalaqah] Exception:', error)
    return { success: false, error: error.message || 'Internal server error' }
  }
}`;

const startMarker = "export async function autoCreateSimpleHalaqah(params: AutoCreateSimpleParams) {";
const endMarker = "export async function deleteHalaqah(id: string) {";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newCode + "\n\n" + content.substring(endIndex);
  fs.writeFileSync(path, content);
  console.log("Successfully replaced autoCreateSimpleHalaqah!");
} else {
  console.error("Markers not found");
}
