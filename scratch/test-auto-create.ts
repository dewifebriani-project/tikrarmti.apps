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
  const batch_id = '2478b493-1b6b-412a-a05f-6193db815a43'; // Batch 3
  
  // Load programs to map program names to IDs for this batch
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

  // Auto-create missing programs for this batch if they don't exist
  if (!programsMap['tikrar_tahfidz']) {
    console.log('[autoCreateSimpleHalaqah] Auto-creating missing Tikrar Tahfidz program for batch')
    const { data: newProg, error } = await supabaseAdmin.from('programs').insert({
      batch_id,
      name: 'Tahfidz Tikrar MTI',
      description: "Program tahfidz khusus dengan tasmi' one-on-one dengan pasangan belajar",
      status: 'open',
      max_thalibah: 150,
      duration_weeks: 13
    }).select().single()
    if (error) console.error("Error creating tikrar:", error)
    if (newProg) programsMap['tikrar_tahfidz'] = newProg
  }
  
  if (!programsMap['pra_tahfidz']) {
    console.log('[autoCreateSimpleHalaqah] Auto-creating missing Pra-Tikrar program for batch')
    const { data: newProg, error } = await supabaseAdmin.from('programs').insert({
      batch_id,
      name: 'Pra-Tikrar MTI',
      description: 'Program perbaikan bacaan sebelum tikrar',
      status: 'open',
      max_thalibah: 100,
      duration_weeks: 13
    }).select().single()
    if (error) console.error("Error creating pra:", error)
    if (newProg) programsMap['pra_tahfidz'] = newProg
  }

  console.log("Programs Map:");
  console.log(programsMap);
}
main().catch(console.error);
