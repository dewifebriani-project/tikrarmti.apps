import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});
const supabaseAdmin = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
  const batchId = '2478b493-1b6b-412a-a05f-6193db815a43';

  // Fetch muallimah akads for this batch (approved only)
  const { data: muallimahRegsRaw, error } = await supabaseAdmin
    .from('muallimah_akads')
    .select(`
      user_id, 
      class_type, 
      preferred_juz, 
      preferred_schedule, 
      backup_schedule,
      preferred_max_thalibah,
      exclude_from_capacity,
      user:users!muallimah_akads_user_id_fkey(full_name, whatsapp)
    `)
    .eq('batch_id', batchId)
    .eq('status', 'approved');

  console.log('Error:', error);
  console.log('Muallimah Akads count:', muallimahRegsRaw?.length);

  const getBaseJuz = (juz: string): string => {
    const match = juz.trim().match(/^\d+/);
    return match ? match[0] : juz.trim();
  };

  const pendaftarPerJuz = new Map<string, number>();
  const { data: pendaftarList } = await supabaseAdmin
    .from('pendaftaran_tikrar_tahfidz')
    .select('chosen_juz')
    .eq('batch_id', batchId)
    .in('status', ['pending', 'approved']);
  
  if (pendaftarList) {
    pendaftarList.forEach(p => {
      const juz = (p.chosen_juz || 'Unknown').trim();
      const baseJuz = getBaseJuz(juz);
      pendaftarPerJuz.set(baseJuz, (pendaftarPerJuz.get(baseJuz) || 0) + 1);
    });
  }

  const displayGroups = Array.from(new Set<string>(pendaftarPerJuz.keys()));
  
  // Create muallimah map for quick lookup
  const muallimahRegs = (muallimahRegsRaw || []).map(reg => ({
    ...reg,
    full_name: (reg.user as any)?.full_name || 'Unknown',
    wa_phone: (reg.user as any)?.whatsapp || '',
    memorized_juz: '',
    exclude_from_capacity: reg.exclude_from_capacity,
    preferred_max_thalibah: reg.preferred_max_thalibah
  }));
  const muallimahRegsFiltered = muallimahRegs.filter(m => !m.exclude_from_capacity);
  console.log('Filtered Muallimah (not excluded):', muallimahRegsFiltered.length);

  const muallimahsWithSchedules = muallimahRegsFiltered.map(m => {
    const schedulesList: any[] = [];
    try {
      const parsedPref = typeof m.preferred_schedule === 'string' ? JSON.parse(m.preferred_schedule) : m.preferred_schedule;
      const programKeys = ['tikrar', 'pra_tahfidz', 'berbayar', 'tahfidz', 'tashih'];
      
      if (parsedPref) {
        for (const key of programKeys) {
          if (parsedPref[key] && parsedPref[key].day) {
            const d = parsedPref[key].day;
            schedulesList.push({
              type: key === 'pra_tahfidz' ? 'Pra-Tikrar' : key.charAt(0).toUpperCase() + key.slice(1),
              is_backup: false,
              day_name: d.charAt(0).toUpperCase() + d.slice(1),
              start_time: parsedPref[key].time_start || '-',
              end_time: parsedPref[key].time_end || '-'
            });
          }
        }
        if (schedulesList.length === 0 && parsedPref.day) {
          const d = parsedPref.day;
          schedulesList.push({
            type: 'Utama',
            is_backup: false,
            day_name: d.charAt(0).toUpperCase() + d.slice(1),
            start_time: parsedPref.time_start || '-',
            end_time: parsedPref.time_end || '-'
          });
        }
      }
    } catch (e) {
    }

    if (schedulesList.length === 0) {
      schedulesList.push({
        type: 'Utama',
        is_backup: false,
        day_name: '-',
        start_time: '-',
        end_time: '-'
      });
    }

    let juzStr = '';
    if (m.preferred_juz && String(m.preferred_juz).trim() !== '') {
      juzStr = String(m.preferred_juz).trim();
    } else if (m.memorized_juz) {
       juzStr = String(m.memorized_juz).trim();
    }
    
    const preferredJuzs = juzStr.split(',').map(s => getBaseJuz(s.trim())).filter(Boolean);

    return {
      user_id: m.user_id,
      full_name: m.full_name,
      preferred_max_thalibah: m.preferred_max_thalibah || 10,
      preferred_juz: preferredJuzs,
      raw_preferred_juz: m.preferred_juz,
      schedules: schedulesList
    };
  });

  for (const juz of displayGroups) {
    const matchedMuallimahs = muallimahsWithSchedules.filter(m => 
      m.preferred_juz.includes(juz)
    );
    console.log(`Juz ${juz}: found ${matchedMuallimahs.length} muallimahs out of ${muallimahsWithSchedules.length}`);
  }
}
main().catch(console.error);
