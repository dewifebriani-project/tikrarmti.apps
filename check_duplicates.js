const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('user_id, batch_id, full_name, created_at, status, selection_status')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching registrations:', error);
    return;
  }

  const counts = {};
  for (const r of regs) {
    const key = `${r.user_id}_${r.batch_id}`;
    if (!counts[key]) {
      counts[key] = { count: 0, name: r.full_name, details: [] };
    }
    counts[key].count++;
    counts[key].details.push({
      date: r.created_at,
      status: r.status,
      selection_status: r.selection_status
    });
  }

  const duplicates = Object.values(counts).filter(c => c.count > 1);
  
  console.log(`Ditemukan ${duplicates.length} orang yang mendaftar lebih dari 1 kali di batch yang sama:`);
  
  duplicates.forEach((d, i) => {
    console.log(`\n${i + 1}. ${d.name} (${d.count} pendaftaran)`);
    d.details.forEach((det, j) => {
      console.log(`   - Pendaftaran ${j+1}: ${det.date.substring(0, 10)} | Status: ${det.status} | Seleksi: ${det.selection_status}`);
    });
  });
}

run();
