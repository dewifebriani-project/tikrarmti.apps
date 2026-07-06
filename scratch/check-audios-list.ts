import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceKey);

async function checkFile(url: string | null, label: string) {
  if (!url) return;
  const prefix = '/selection-audios/';
  const index = url.indexOf(prefix);
  if (index === -1) {
    console.log(`[${label}] URL format unrecognized: ${url}`);
    return;
  }
  const path = decodeURIComponent(url.substring(index + prefix.length));

  const { data: fileData, error } = await supabase.storage
    .from('selection-audios')
    .download(path);

  if (error || !fileData) {
    console.log(`[${label}] Failed to download ${path}:`, error?.message);
    return;
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Check EBML header
  const isWebM = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
  console.log(`[${label}] File: ${path} | Size: ${buffer.length} bytes | Starts with WebM Header: ${isWebM}`);
  
  // If it's WebM, check if there is an end boundary string inside it just in case
  const textDecoder = new TextDecoder('utf-8');
  // Scan a small portion of the end to see if WebKit boundary is there
  const endPreview = textDecoder.decode(buffer.subarray(Math.max(0, buffer.length - 1000)));
  const hasBoundaryAtEnd = endPreview.includes('WebKitFormBoundary');
  console.log(`[${label}] Has WebKitFormBoundary text at end: ${hasBoundaryAtEnd}`);
}

async function run() {
  const { data: regs, error } = await supabase
    .from('pendaftaran_tikrar_tahfidz')
    .select('id, full_name, oral_submission_url, oral_assessment_audio_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch failed:', error);
    return;
  }

  console.log(`Checking ${regs?.length} registrations...`);

  for (const r of regs || []) {
    console.log(`\n--- Registrant: ${r.full_name} (${r.id}) ---`);
    if (r.oral_submission_url) {
      await checkFile(r.oral_submission_url, 'Submission');
    }
    if (r.oral_assessment_audio_url) {
      await checkFile(r.oral_assessment_audio_url, 'Assessment Feedback');
    }
  }
}

run().catch(console.error);
