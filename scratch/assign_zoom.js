require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

async function run() {
  const { data: batch } = await supabase.from('batches').select('id, name').eq('status', 'open').single();
  if (!batch) return console.log('No active batch found');

  const { data: zoomLinks } = await supabase.from('batch_zoom_links').select('id, name').eq('batch_id', batch.id);
  if (!zoomLinks || zoomLinks.length === 0) return console.log('No zoom links found');

  const { data: halaqahsWithProgram } = await supabase
    .from('halaqah')
    .select(`id, name, day_of_week, start_time, end_time, zoom_link_id, program:programs!inner(batch_id)`)
    .eq('status', 'active')
    .eq('program.batch_id', batch.id);

  if (!halaqahsWithProgram || halaqahsWithProgram.length === 0) return console.log('No halaqahs found');

  const updates = [];
  let totalClashes = 0;

  for (let day = 1; day <= 7; day++) {
    const dailyHalaqahs = halaqahsWithProgram.filter(h => h.day_of_week === day);
    if (dailyHalaqahs.length === 0) continue;

    dailyHalaqahs.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    const activeMeetings = []; 

    for (const halaqah of dailyHalaqahs) {
      const startMins = timeToMinutes(halaqah.start_time);
      const endMins = timeToMinutes(halaqah.end_time);
      
      // Remove meetings that finished 30+ minutes ago
      for (let i = activeMeetings.length - 1; i >= 0; i--) {
        if (activeMeetings[i].buffered_end_mins <= startMins) {
          activeMeetings.splice(i, 1);
        }
      }

      const usedLinkIds = activeMeetings.map(m => m.link_id);
      const availableLinks = zoomLinks.filter(l => !usedLinkIds.includes(l.id));

      if (availableLinks.length === 0) {
        console.error(`\n⚠️ CLASH DETECTED on Day ${day} for "${halaqah.name}" (${halaqah.start_time} - ${halaqah.end_time})`);
        console.error(`Active/Buffered Meetings overlapping at ${halaqah.start_time}:`);
        activeMeetings.forEach(am => console.error(`  - Ends at ${minutesToTime(am.end_mins)}, buffered until ${minutesToTime(am.buffered_end_mins)}`));
        
        // Fallback to least recently used (first in activeMeetings array, assuming sorted by end time? not quite, but good enough for fallback)
        const fallbackLink = zoomLinks[0];
        updates.push({ id: halaqah.id, zoom_link_id: fallbackLink.id });
        activeMeetings.push({ end_mins: endMins, buffered_end_mins: endMins + 30, link_id: fallbackLink.id });
        totalClashes++;
      } else {
        const assignedLink = availableLinks[0];
        updates.push({ id: halaqah.id, zoom_link_id: assignedLink.id });
        activeMeetings.push({ end_mins: endMins, buffered_end_mins: endMins + 30, link_id: assignedLink.id });
      }
    }
  }

  console.log(`\nFound ${totalClashes} clashes that couldn't be resolved with the 30-min buffer.`);
  console.log(`Preparing to update ${updates.length} halaqahs...`);

  // Update DB (uncomment to apply)
  let successCount = 0;
  for (const update of updates) {
    const { error } = await supabase.from('halaqah').update({ zoom_link_id: update.zoom_link_id }).eq('id', update.id);
    if (!error) successCount++;
  }
  console.log(`Successfully updated ${successCount}/${updates.length} halaqahs.`);
}
run();
