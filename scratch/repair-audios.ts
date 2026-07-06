import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function repair(path: string) {
  console.log(`Checking file: ${path}`);
  
  // Download the raw file
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('selection-audios')
    .download(path);

  if (downloadError) {
    console.error(`Failed to download ${path}:`, downloadError);
    return;
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Find binary boundary
  const markerStr = 'Content-Type: audio/webm\r\n\r\n';
  const markerBuffer = Buffer.from(markerStr);
  let startIndex = buffer.indexOf(markerBuffer);
  
  if (startIndex === -1) {
    // Try with \n\n just in case
    const markerStr2 = 'Content-Type: audio/webm\n\n';
    startIndex = buffer.indexOf(Buffer.from(markerStr2));
  }

  if (startIndex === -1) {
    console.log(`File ${path} does not seem to have the multipart text wrapper. Skipping.`);
    return;
  }

  // Calculate actual binary start
  const binaryStart = startIndex + (buffer.indexOf(Buffer.from('Content-Type: audio/webm')) === startIndex ? markerBuffer.length : 0);
  
  // Let's scan for the start index of the actual binary webm header (Eߣ / 1A 45 DF A3)
  const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
  const webmStart = buffer.indexOf(webmHeader, startIndex);
  
  if (webmStart === -1) {
    console.error(`Could not find WebM header signature in ${path}`);
    return;
  }

  // Find end boundary (starts with \r\n-- or \n--)
  let binaryEnd = buffer.length;
  for (let i = webmStart; i < buffer.length - 2; i++) {
    if (buffer[i] === 0x0D && buffer[i+1] === 0x0A && buffer[i+2] === 0x2D && buffer[i+3] === 0x2D) { // \r\n--
      binaryEnd = i;
      break;
    }
    if (buffer[i] === 0x0A && buffer[i+1] === 0x2D && buffer[i+2] === 0x2D) { // \n--
      binaryEnd = i;
      break;
    }
  }

  const cleanBuffer = buffer.subarray(webmStart, binaryEnd);
  console.log(`Original Size: ${buffer.length} | Cleaned Size: ${cleanBuffer.length}`);

  // Re-upload the clean binary back to the exact same path
  const { error: uploadError } = await supabase.storage
    .from('selection-audios')
    .upload(path, cleanBuffer, {
      contentType: 'audio/webm',
      upsert: true
    });

  if (uploadError) {
    console.error(`Failed to upload cleaned file for ${path}:`, uploadError);
  } else {
    console.log(`Successfully repaired and re-uploaded: ${path}`);
  }
}

async function run() {
  await repair('5dfde1f0-08fb-4d26-88d1-fc233d6bdec6_alfath29_1782786733602.webm');
  await repair('feedback/3c1509b1-293d-412b-a3ec-14d6c6c2c077-1782918102051.webm');
}

run().catch(console.error);
