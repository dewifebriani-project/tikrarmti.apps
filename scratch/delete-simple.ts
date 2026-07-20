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
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function main() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  today.setHours(0,0,0,0);
  
  const { data: halaqahs } = await supabase.from('halaqah').select('id, name').is('program_id', null).gte('created_at', today.toISOString());
  console.log(`Found ${halaqahs?.length || 0} simple halaqahs to delete.`);
  
  if (halaqahs && halaqahs.length > 0) {
    const hIds = halaqahs.map(h => h.id);
    
    await supabase.from('halaqah_mentors').delete().in('halaqah_id', hIds);
    const { error } = await supabase.from('halaqah').delete().in('id', hIds);
    if (!error) console.log('Successfully deleted the simple halaqahs!');
    else console.error(error);
  }
}
main().catch(console.error);
