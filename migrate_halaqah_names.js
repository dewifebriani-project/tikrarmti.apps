require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkNames() {
  const { data, error } = await supabase
    .from('halaqah')
    .select('id, name');
    
  if (error) {
    console.error(error);
    return;
  }
  
  for (const h of data) {
    let oldName = h.name;
    let newName = oldName;
    
    // Tahfidz Tikrar MTI - Juz 1 - Ustadzah Khairunnisa Mukhtar
    if (oldName.includes('Tahfidz Tikrar MTI')) {
      newName = oldName
        .replace('Tahfidz Tikrar MTI - ', 'Tikrar ')
        .replace('Tahfidz Tikrar MTI', 'Tikrar')
        .replace(' - Ustadzah ', ' | ')
        .replace(' - Ustadz ', ' | ')
        .replace(' - ', ' | '); // fallback for any other delimiter before name
    } else if (oldName.includes('Pra-Tikrar') || oldName.includes('Pra Tikrar')) {
      newName = oldName
        .replace('Pra-Tikrar MTI', 'Pra-Tikrar')
        .replace('Pra Tikrar MTI', 'Pra-Tikrar')
        .replace(' - Ustadzah ', ' | ')
        .replace(' - Ustadz ', ' | ')
        .replace(' - ', ' | ');
    } else if (oldName.startsWith('Halaqah Ustadzah')) {
      newName = oldName.replace('Halaqah Ustadzah', 'Halaqah |');
    } else if (oldName.toLowerCase().includes('premium') || oldName.toLowerCase().includes('berbayar')) {
      newName = oldName
        .replace(' - Ustadzah ', ' | ')
        .replace(' - ', ' | ');
    } else {
      newName = oldName
        .replace(' - Ustadzah ', ' | ')
        .replace(' - ', ' | ');
    }
    
    // Clean up any extra spaces
    newName = newName.trim().replace(/\s+/g, ' ');
    
    if (newName !== oldName) {
      console.log(`UPDATING: ${oldName} -> ${newName}`);
      const { error: updateError } = await supabase
        .from('halaqah')
        .update({ name: newName })
        .eq('id', h.id);
        
      if (updateError) {
        console.error(`FAILED to update ${h.id}:`, updateError);
      }
    }
  }
  console.log('Migration complete.');
}
checkNames();
