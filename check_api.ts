import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const url = 'http://localhost:3000/api/shared/halaqah-quota?batch_id=2478b493-1b6b-412a-a05f-6193db815a43';
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log(JSON.stringify(json.data.halaqah.slice(0, 3), null, 2));
  } catch (e) {
    console.log("Fetch failed");
  }
}
check();
