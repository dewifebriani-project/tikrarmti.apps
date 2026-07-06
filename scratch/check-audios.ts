import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

// Load env
dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);
const filename = 'cb728515-5e67-4eb2-9cb8-1f48aca9354b_alfath29_1782871331746.webm'; // Athirah's file

async function testRepair() {
  console.log('Downloading file...');
  const { data, error } = await supabase.storage
    .from('selection-audios')
    .download(filename);

  if (error || !data) {
    console.error('Download failed:', error);
    return;
  }

  const arrayBuffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  
  // Convert beginning to string
  const textDecoder = new TextDecoder('utf-8');
  const headerPreview = textDecoder.decode(uint8.subarray(0, 1024));
  
  console.log('Header Preview (first 300 chars):');
  console.log(headerPreview.substring(0, 300));

  if (headerPreview.startsWith('------')) {
    console.log('File is corrupted with WebKitFormBoundary! Repairing...');
    
    const boundaryLine = headerPreview.split('\r\n')[0];
    console.log('Boundary line:', boundaryLine);

    const contentTypeIndex = headerPreview.indexOf('Content-Type:');
    const doubleNewlineIndex = headerPreview.indexOf('\r\n\r\n', contentTypeIndex);
    const dataStartIndex = doubleNewlineIndex + 4;

    console.log('Data starts at index:', dataStartIndex);

    // Find closing boundary
    const closingBoundary = '\r\n' + boundaryLine;
    const closingBoundaryBytes = new TextEncoder().encode(closingBoundary);

    let dataEndIndex = uint8.length;
    for (let i = dataStartIndex; i < uint8.length - closingBoundaryBytes.length; i++) {
      let match = true;
      for (let j = 0; j < closingBoundaryBytes.length; j++) {
        if (uint8[i + j] !== closingBoundaryBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        dataEndIndex = i;
        break;
      }
    }

    console.log('Data ends at index:', dataEndIndex);
    console.log('Total file length:', uint8.length);

    const audioBytes = uint8.subarray(dataStartIndex, dataEndIndex);
    console.log('Extracted audio bytes length:', audioBytes.length);

    // Write to a local file to test
    const outputPath = join(process.cwd(), 'scratch', 'repaired_audio.webm');
    fs.writeFileSync(outputPath, Buffer.from(audioBytes));
    console.log(`Saved repaired file to: ${outputPath}`);

    // Read the first 4 bytes of repaired file to see if it starts with EBML (webm) header
    const repairedHeader = audioBytes.subarray(0, 4);
    console.log('Repaired file magic bytes (hex):', 
      Array.from(repairedHeader).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
    );
    // EBML header is 1A 45 DF A3
    if (repairedHeader[0] === 0x1A && repairedHeader[1] === 0x45 && repairedHeader[2] === 0xDF && repairedHeader[3] === 0xA3) {
      console.log('🎉 SUCCESS: Magic bytes match EBML (WebM/MKV) header!');
    } else {
      console.log('⚠️ WARNING: Magic bytes do not match EBML header. Output:', repairedHeader);
    }
  } else {
    console.log('File is not corrupted.');
  }
}

testRepair().catch(console.error);
