/**
 * Script untuk debugging jurnal records
 * Gunakan: npx tsx scripts/debug-jurnal-record.ts
 *
 * Script ini akan mengecek:
 * 1. Total jurnal records per user
 * 2. Format blok field (string vs array)
 * 3. Weekly status calculation
 * 4. Block-based status
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY harus diset');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper functions dari route.ts
function calculateWeekFromBlok(blok: string | null): number | null {
  if (!blok) return null;

  let blokCode: string | null = blok;

  // Handle array format like "[\"H11A\"]"
  if (blokCode.startsWith('[')) {
    try {
      const parsed = JSON.parse(blokCode);
      if (Array.isArray(parsed) && parsed.length > 0) {
        blokCode = parsed[0];
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (!blokCode) return null;

  // Extract number from blok code (e.g., "H1A" -> 1, "H11B" -> 11)
  const match = blokCode.match(/H(\d+)/);
  if (!match) return null;

  const blockNumber = parseInt(match[1], 10);

  // Map block number to week
  if (blockNumber >= 1 && blockNumber <= 10) {
    return blockNumber;
  } else if (blockNumber >= 11 && blockNumber <= 20) {
    return blockNumber - 10;
  }

  return null;
}

function parseBlokField(blok: any): string[] {
  if (!blok) return [];
  if (typeof blok === 'string') {
    // Check if it's JSON array format
    if (blok.startsWith('[')) {
      try {
        const parsed = JSON.parse(blok);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // If parse fails, split by comma
        return blok.split(',').map(b => b.trim()).filter(b => b);
      }
    }
    return blok.split(',').map(b => b.trim()).filter(b => b);
  }
  if (Array.isArray(blok)) {
    return blok;
  }
  return [];
}

// Generate all blocks for a juz (simplified version)
function generateAllBlocks(juzInfo: any) {
  const allBlocks: any[] = [];
  const parts = ['A', 'B', 'C', 'D'];

  const totalPages = juzInfo.end_page - juzInfo.start_page + 1;
  const pagesPerBlock = totalPages / 40;
  const weeks = Math.ceil(40 / 4);

  for (let week = 1; week <= weeks; week++) {
    let blockNumber: number;
    if (juzInfo.part === 'A') {
      blockNumber = (week - 1) * 4 + 1;
    } else {
      blockNumber = week + 10;
    }

    for (let i = 0; i < 4; i++) {
      const part = parts[i];
      const blockCode = `H${blockNumber}${part}`;

      allBlocks.push({
        block_code: blockCode,
        week_number: week,
        part,
        is_completed: false,
        jurnal_count: 0
      });
    }
  }

  return allBlocks;
}

// Calculate weekly status (dari route.ts)
function calculateWeeklyStatus(allBlocks: any[], jurnalRecords: any[]) {
  const blockStatus = new Map<string, { is_completed: boolean; jurnal_count: number; jurnal_date?: string }>();

  // Initialize all blocks as not completed
  allBlocks.forEach(block => {
    blockStatus.set(block.block_code, { is_completed: false, jurnal_count: 0 });
  });

  // Mark blocks that have jurnal records
  jurnalRecords.forEach(record => {
    if (record.blok) {
      const blokCode = record.blok;
      const current = blockStatus.get(blokCode);
      if (current) {
        current.is_completed = true;
        current.jurnal_count += 1;
        if (!current.jurnal_date || new Date(record.tanggal_setor || record.created_at) > new Date(current.jurnal_date)) {
          current.jurnal_date = record.tanggal_setor || record.created_at;
        }
        blockStatus.set(blokCode, current);
      }
    }
  });

  const weeklyStatus: any[] = [];
  for (let week = 1; week <= 10; week++) {
    const weekBlocks = allBlocks.filter(b => b.week_number === week);
    const completedBlocks = weekBlocks.filter(b => {
      const status = blockStatus.get(b.block_code);
      return status?.is_completed || false;
    });

    weeklyStatus.push({
      week_number: week,
      total_blocks: weekBlocks.length,
      completed_blocks: completedBlocks.length,
      is_completed: completedBlocks.length === weekBlocks.length,
      blocks: weekBlocks.map(b => ({
        ...b,
        is_completed: blockStatus.get(b.block_code)?.is_completed || false,
        jurnal_count: blockStatus.get(b.block_code)?.jurnal_count || 0
      }))
    });
  }

  return weeklyStatus;
}

// Main debugging function
async function debugJurnalRecords() {
  console.log('🔍 Starting Jurnal Records Debug...\n');

  // 1. Get all daftar ulang users
  console.log('📋 Step 1: Fetching daftar ulang users...');
  const { data: daftarUlangUsers, error: daftarUlangError } = await supabase
    .from('daftar_ulang_submissions')
    .select('user_id, confirmed_chosen_juz, status, submitted_at, reviewed_at')
    .in('status', ['approved', 'submitted']);

  if (daftarUlangError) {
    console.error('❌ Error fetching daftar ulang:', daftarUlangError);
    return;
  }

  const daftarUlangUserIds = daftarUlangUsers?.map((d: any) => d.user_id) || [];
  console.log(`✅ Found ${daftarUlangUserIds.length} daftar ulang users\n`);

  if (daftarUlangUserIds.length === 0) {
    console.log('⚠️ No daftar ulang users found. Exiting.');
    return;
  }

  // 2. Get juz info
  console.log('📚 Step 2: Fetching juz info...');
  const uniqueJuzCodes = new Set(
    daftarUlangUsers?.map((d: any) => d.confirmed_chosen_juz).filter(Boolean) || []
  );

  const { data: juzOptions } = await supabase
    .from('juz_options')
    .select('*')
    .in('code', Array.from(uniqueJuzCodes));

  const juzInfoMap = new Map();
  juzOptions?.forEach((juz: any) => {
    juzInfoMap.set(juz.code, juz);
  });
  console.log(`✅ Found ${juzInfoMap.size} unique juz codes\n`);

  // 3. Get all jurnal records
  console.log('📖 Step 3: Fetching jurnal records...');
  const { data: jurnalRecords, error: jurnalError } = await supabase
    .from('jurnal_records')
    .select('*')
    .in('user_id', daftarUlangUserIds)
    .order('tanggal_setor', { ascending: false });

  if (jurnalError) {
    console.error('❌ Error fetching jurnal records:', jurnalError);
    return;
  }

  console.log(`✅ Found ${jurnalRecords?.length || 0} total jurnal records\n`);

  // 4. Get user data
  console.log('👤 Step 4: Fetching user data...');
  const { data: usersData } = await supabase
    .from('users')
    .select('id, full_name, nama_kunyah, whatsapp')
    .in('id', daftarUlangUserIds);

  const userMap = new Map();
  usersData?.forEach((u: any) => {
    userMap.set(u.id, u);
  });
  console.log(`✅ Found ${userMap.size} users\n`);

  // 5. Group jurnal records by user
  const jurnalByUser = new Map();
  (jurnalRecords || []).forEach((record: any) => {
    if (!jurnalByUser.has(record.user_id)) {
      jurnalByUser.set(record.user_id, []);
    }
    jurnalByUser.get(record.user_id).push(record);
  });

  // 6. Analyze each user
  console.log('🔬 Step 5: Analyzing jurnal records per user...\n');
  console.log('='.repeat(100));

  const daftarUlangMap = new Map();
  daftarUlangUsers?.forEach((d: any) => {
    daftarUlangMap.set(d.user_id, d);
  });

  for (const userId of daftarUlangUserIds) {
    const user = userMap.get(userId);
    const userJurnalRecords = jurnalByUser.get(userId) || [];
    const daftarUlang = daftarUlangMap.get(userId);
    const juzCode = daftarUlang?.confirmed_chosen_juz;
    const juzInfo = juzCode ? juzInfoMap.get(juzCode) : null;

    console.log(`\n👤 User: ${user?.full_name || 'Unknown'} (${userId})`);
    console.log(`   Juz: ${juzCode || 'Not set'}`);
    console.log(`   Jurnal Records: ${userJurnalRecords.length}`);

    if (userJurnalRecords.length === 0) {
      console.log(`   ⚠️ No jurnal records found`);
      continue;
    }

    console.log(`\n   📋 Jurnal Records Detail:`);

    // Show each record with blok analysis
    userJurnalRecords.forEach((record: any, idx: number) => {
      const blokRaw = record.blok;
      const blokParsed = parseBlokField(record.blok);
      const weekFromBlok = calculateWeekFromBlok(record.blok);

      console.log(`   [${idx + 1}] ID: ${record.id}`);
      console.log(`       Blok (raw): ${JSON.stringify(blokRaw)}`);
      console.log(`       Blok (parsed): [${blokParsed.join(', ')}]`);
      console.log(`       Week calculated: ${weekFromBlok || 'N/A'}`);
      console.log(`       Tanggal Setor: ${record.tanggal_setor || record.created_at}`);

      // Check if blok matches expected format
      if (blokParsed.length === 0) {
        console.log(`       ❌ ISSUE: Blok field is empty or invalid`);
      } else {
        // Check if any blok matches the expected blocks for this juz
        if (juzInfo) {
          const allBlocks = generateAllBlocks(juzInfo);
          const validBlocks = allBlocks.map(b => b.block_code);
          const matchingBlocks = blokParsed.filter(b => validBlocks.includes(b));

          if (matchingBlocks.length === 0) {
            console.log(`       ❌ ISSUE: Blok [${blokParsed.join(', ')}] does not match any expected blocks for juz ${juzCode}`);
            console.log(`       Expected blocks example: ${validBlocks.slice(0, 4).join(', ')}...`);
          } else {
            console.log(`       ✅ Blok [${matchingBlocks.join(', ')}] matches expected blocks`);
          }
        }
      }
    });

    // Calculate weekly status
    if (juzInfo) {
      const allBlocks = generateAllBlocks(juzInfo);
      const weeklyStatus = calculateWeeklyStatus(allBlocks, userJurnalRecords);

      console.log(`\n   📊 Weekly Status Analysis:`);
      console.log(`   Total Expected Blocks: ${allBlocks.length}`);

      weeklyStatus.forEach((week: any) => {
        if (week.completed_blocks > 0) {
          console.log(`   Week ${week.week_number}: ${week.completed_blocks}/${week.total_blocks} blocks completed`);
          week.blocks.forEach((block: any) => {
            if (block.is_completed) {
              console.log(`     ✓ ${block.block_code} (${block.jurnal_count} records)`);
            }
          });
        }
      });

      const totalCompleted = allBlocks.filter(b => {
        const status = weeklyStatus.find(w => w.week_number === b.week_number);
        return status?.blocks?.find((block: any) => block.block_code === b.block_code && block.is_completed);
      }).length;

      console.log(`   Summary: ${totalCompleted}/${allBlocks.length} blocks (${Math.round((totalCompleted / allBlocks.length) * 100)}%)`);

      // Check if 0/4 issue
      const week1 = weeklyStatus.find(w => w.week_number === 1);
      if (week1 && week1.completed_blocks === 0 && userJurnalRecords.length > 0) {
        console.log(`   ❌ ISSUE DETECTED: User has ${userJurnalRecords.length} jurnal records but Week 1 shows 0/4 blocks!`);
        console.log(`   Possible cause: Blok codes in records don't match expected blocks for juz ${juzCode}`);
      }
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n🔍 Analysis Complete!\n');

  // Summary statistics
  console.log('📈 Summary Statistics:');
  console.log(`   Total daftar ulang users: ${daftarUlangUserIds.length}`);
  console.log(`   Total jurnal records: ${jurnalRecords?.length || 0}`);
  console.log(`   Users with jurnal: ${jurnalByUser.size}`);
  console.log(`   Users without jurnal: ${daftarUlangUserIds.length - jurnalByUser.size}\n`);
}

// Run the debug function
debugJurnalRecords().catch(console.error);
