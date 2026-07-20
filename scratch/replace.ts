import * as fs from 'fs';
const path = 'app/api/halaqah/auto-create/route.ts';
let content = fs.readFileSync(path, 'utf-8');

const newCode = `    // Get program details
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('*')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    
    // Determine the program key based on program name to look up the correct schedule in the JSON
    const pName = program.name.toLowerCase();
    const isTikrar = pName.includes('tahfidz tikrar');
    const isPra = pName.includes('pra-tikrar') || pName.includes('pra tikrar') || pName.includes('pra_tahfidz');
    const scheduleKey = isTikrar ? 'tikrar' : (isPra ? 'pra_tahfidz' : null);

    // Get all approved and not excluded muallimah akads for this batch
    const { data: akads, error: fetchError } = await supabaseAdmin
      .from('muallimah_akads')
      .select(\`
        id,
        user_id,
        preferred_juz,
        preferred_max_thalibah,
        class_type,
        preferred_schedule,
        users ( full_name )
      \`)
      .eq('batch_id', batch_id)
      .eq('status', 'approved')
      .eq('exclude_from_capacity', false);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (!akads || akads.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: 0,
        errors: ['No valid (non-excluded) muallimah akads found for this batch']
      }, { status: 200 });
    }

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

    let created = 0;
    let skipped = 0;
    const errors: Array<{ muallimah: string; error: string }> = [];

    // Create halaqah for each muallimah based on their akad
    for (const akad of akads) {
      const fullName = akad.users?.full_name || 'Unknown Muallimah';
      try {
        // Parse the preferred_schedule JSON
        let schedulesJson: any = null;
        try {
          schedulesJson = typeof akad.preferred_schedule === 'string' 
            ? JSON.parse(akad.preferred_schedule) 
            : akad.preferred_schedule;
        } catch (e) {
          skipped++;
          errors.push({
            muallimah: fullName,
            error: 'Failed to parse preferred_schedule JSON'
          });
          continue;
        }

        if (!schedulesJson || !scheduleKey || !schedulesJson[scheduleKey]) {
          skipped++;
          errors.push({
            muallimah: fullName,
            error: \`No schedule found for program type: \${scheduleKey || 'unknown'}\`
          });
          continue;
        }

        const schedule = schedulesJson[scheduleKey];
        const dayNum = mapDayToNumber(schedule.day);
        
        if (!dayNum || !schedule.time_start || !schedule.time_end) {
          skipped++;
          errors.push({
            muallimah: fullName,
            error: 'Incomplete schedule data (missing day, time_start, or time_end)'
          });
          continue;
        }

        const halaqahName = \`\${program.name} - Juz \${akad.preferred_juz} - \${fullName}\`;

        const { data: newHalaqah, error: createError } = await supabaseAdmin
          .from('halaqah')
          .insert({
            program_id,
            muallimah_id: akad.user_id,
            name: halaqahName,
            day_of_week: dayNum,
            start_time: schedule.time_start,
            end_time: schedule.time_end,
            preferred_juz: akad.preferred_juz,
            max_students: akad.preferred_max_thalibah || 15,
            waitlist_max: 5,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) {
          errors.push({
            muallimah: fullName,
            error: createError.message
          });
          continue;
        }

        // Assign muallimah as primary mentor
        await supabaseAdmin
          .from('halaqah_mentors')
          .insert({
            halaqah_id: newHalaqah.id,
            mentor_id: akad.user_id,
            role: 'ustadzah',
            is_primary: true
          });

        created++;
      } catch (err: any) {
        errors.push({
          muallimah: fullName,
          error: err.message || 'Unknown error'
        });
      }
    }`;

// Find the section to replace: from `    // Get all approved muallimah registrations` down to the end of the `try` block before returning JSON
const startMarker = "    // Get all approved muallimah registrations for this batch";
const endMarker = "    return NextResponse.json({";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newCode + "\n\n" + content.substring(endIndex);
  fs.writeFileSync(path, content);
  console.log("Successfully replaced!");
} else {
  console.error("Markers not found");
}
