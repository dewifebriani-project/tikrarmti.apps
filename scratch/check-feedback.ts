import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);
const filename = 'feedback/b295b370-1edc-4319-8e64-13dbf32fa9ed-1782913610811.webm';

async function check() {
  console.log(`Downloading ${filename}...`);
  const { data, error } = await supabase.storage
    .from('selection-audios')
    .download(filename);

  if (error || !data) {
    console.error('Download failed:', error);
    return;
  }

  console.log('Download success. File size:', data.size);
  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  
  // Show first 16 bytes in hex
  const hex = Array.from(uint8.subarray(0, 16)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  console.log('First 16 bytes (hex):', hex);

  // EBML WebM header: 1A 45 DF A3
  if (uint8[0] === 0x1A && uint8[1] === 0x45 && uint8[2] === 0xDF && uint8[3] === 0xA3) {
    console.log('File matches EBML (WebM) header!');
  } else if (uint8[4] === 0x66 && uint8[5] === 0x74 && uint8[6] === 0x79 && uint8[7] === 0x70) {
    console.log('File matches MP4 header!');
  } else {
    const textDecoder = new TextDecoder('utf-8');
    const preview = textDecoder.decode(uint8.subarray(0, 100));
    console.log('Preview (text):', preview);
  }
}

check().catch(console.error);
