import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanFile(path: string) {
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
  const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
  const webmStart = buffer.indexOf(webmHeader);
  
  if (webmStart === -1) {
    console.log(`[OK/Skipped] File ${path} does not have WebM header signature (might be valid MP4/unaffected or not corrupted).`);
    return;
  }

  if (webmStart === 0) {
    console.log(`[OK] File ${path} is already clean (binary starts at 0).`);
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
  console.log(`[CORRUPT FOUND] File: ${path} | Original Size: ${buffer.length} | Cleaned Size: ${cleanBuffer.length}`);

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

async function getFilenameFromUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  // URL format: https://.../storage/v1/object/public/selection-audios/<path>
  const prefix = '/selection-audios/';
  const index = url.indexOf(prefix);
  if (index === -1) return null;
  return decodeURIComponent(url.substring(index + prefix.length));
}

async function run() {
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, full_name, oral_submission_url, oral_assessment_audio_url');

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log(`Checking ${regs?.length} registrations...`);

  for (const r of regs || []) {
    const submissionPath = await getFilenameFromUrl(r.oral_submission_url);
    if (submissionPath) {
      try {
        await cleanFile(submissionPath);
      } catch (e: any) {
        console.error(`Error repairing submission for ${r.full_name}:`, e.message);
      }
    }

    const feedbackPath = await getFilenameFromUrl(r.oral_assessment_audio_url);
    if (feedbackPath) {
      try {
        await cleanFile(feedbackPath);
      } catch (e: any) {
        console.error(`Error repairing feedback for ${r.full_name}:`, e.message);
      }
    }
  }
  
  console.log('All checks and repairs complete!');
}

run().catch(console.error);
