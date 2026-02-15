/**
 * Debug script to test the weekly status calculation logic
 * Run: npx tsx scripts/debug-weekly-status.ts
 */

interface JuzInfo {
  code: string;
  part: 'A' | 'B';
  start_page: number;
  end_page: number;
}

interface JurnalRecord {
  id: string;
  user_id: string;
  blok: string | null;
  tanggal_setor: string | null;
  created_at: string;
}

// Copy of the generateAllBlocks function from the API
function generateAllBlocksDebug(juzInfo: JuzInfo) {
  const allBlocks: any[] = [];
  const parts = ['A', 'B', 'C', 'D'];
  const blockOffset = juzInfo.part === 'B' ? 10 : 0;

  console.log(`Generating blocks for juz ${juzInfo.code} (part ${juzInfo.part}), offset: ${blockOffset}`);

  for (let week = 1; week <= 10; week++) {
    const blockNumber = week + blockOffset;
    const weekStartPage = juzInfo.start_page + (week - 1);

    for (let i = 0; i < 4; i++) {
      const part = parts[i];
      const blockCode = `H${blockNumber}${part}`;
      const blockPage = Math.min(weekStartPage + i, juzInfo.end_page);

      allBlocks.push({
        block_code: blockCode,
        week_number: week,
        part,
        start_page: blockPage,
        end_page: blockPage,
      });
    }
  }

  return allBlocks;
}

// Copy of the calculateWeeklyStatus function from the API
function calculateWeeklyStatus(allBlocks: any[], jurnalRecords: JurnalRecord[]) {
  const blockStatus = new Map<string, { is_completed: boolean; jurnal_count: number; jurnal_date?: string }>();

  // Initialize all blocks as not completed
  allBlocks.forEach(block => {
    blockStatus.set(block.block_code, { is_completed: false, jurnal_count: 0 });
  });

  console.log('\n=== Processing jurnal records ===');
  // Mark blocks that have jurnal records
  jurnalRecords.forEach(record => {
    if (record.blok) {
      // Handle both string and array format for blok field
      let blokCodes: string[] = [];
      if (typeof record.blok === 'string' && record.blok.startsWith('[')) {
        try {
          const parsed = JSON.parse(record.blok);
          blokCodes = Array.isArray(parsed) ? parsed : [record.blok];
        } catch {
          blokCodes = [record.blok];
        }
      } else {
        blokCodes = [record.blok];
      }

      console.log(`Record blok: "${record.blok}" -> parsed to:`, blokCodes);

      // Mark each blok as completed
      blokCodes.forEach(blokCode => {
        const current = blockStatus.get(blokCode);
        console.log(`  Looking for block "${blokCode}": ${current ? 'FOUND' : 'NOT FOUND'}`);
        if (current) {
          current.is_completed = true;
          current.jurnal_count += 1;
          blockStatus.set(blokCode, current);
        }
      });
    }
  });

  const weeklyStatus: any[] = [];
  console.log('\n=== Calculating weekly status ===');
  for (let week = 1; week <= 4; week++) { // Only show first 4 weeks
    const weekBlocks = allBlocks.filter(b => b.week_number === week);
    const completedBlocks = weekBlocks.filter(b => {
      const status = blockStatus.get(b.block_code);
      return status?.is_completed || false;
    });

    console.log(`Week ${week}:`);
    console.log(`  Expected blocks: ${weekBlocks.map(b => b.block_code).join(', ')}`);
    console.log(`  Completed blocks: ${completedBlocks.map(b => b.block_code).join(', ')}`);
    console.log(`  Status: ${completedBlocks.length}/${weekBlocks.length}`);

    weeklyStatus.push({
      week_number: week,
      total_blocks: weekBlocks.length,
      completed_blocks: completedBlocks.length,
      is_completed: completedBlocks.length === weekBlocks.length,
    });
  }

  return weeklyStatus;
}

// Test with sample data from Aam Ummu Rifki
function testAamUmmuRifki() {
  console.log('========================================');
  console.log('Testing: Aam Ummu Rifki (Juz 30A)');
  console.log('========================================');

  const juz30A: JuzInfo = {
    code: '30A',
    part: 'A',
    start_page: 578,
    end_page: 604,
  };

  // Generate all blocks
  const allBlocks = generateAllBlocksDebug(juz30A);
  console.log(`Total blocks generated: ${allBlocks.length}`);
  console.log(`First 4 blocks: ${allBlocks.slice(0, 4).map(b => b.block_code).join(', ')}`);

  // Sample jurnal records (from SQL query results)
  const jurnalRecords: JurnalRecord[] = [
    { id: '1', user_id: 'user1', blok: 'H1A', tanggal_setor: '2025-01-01', created_at: '2025-01-01' },
    { id: '2', user_id: 'user1', blok: 'H1B', tanggal_setor: '2025-01-02', created_at: '2025-01-02' },
    { id: '3', user_id: 'user1', blok: 'H1C', tanggal_setor: '2025-01-03', created_at: '2025-01-03' },
    { id: '4', user_id: 'user1', blok: 'H1D', tanggal_setor: '2025-01-04', created_at: '2025-01-04' },
    { id: '5', user_id: 'user1', blok: 'H2A', tanggal_setor: '2025-01-05', created_at: '2025-01-05' },
    { id: '6', user_id: 'user1', blok: 'H2B', tanggal_setor: '2025-01-06', created_at: '2025-01-06' },
    { id: '7', user_id: 'user1', blok: 'H2C', tanggal_setor: '2025-01-07', created_at: '2025-01-07' },
    { id: '8', user_id: 'user1', blok: 'H2D', tanggal_setor: '2025-01-08', created_at: '2025-01-08' },
    { id: '9', user_id: 'user1', blok: 'H3A', tanggal_setor: '2025-01-09', created_at: '2025-01-09' },
    { id: '10', user_id: 'user1', blok: 'H3B', tanggal_setor: '2025-01-10', created_at: '2025-01-10' },
    { id: '11', user_id: 'user1', blok: 'H3C', tanggal_setor: '2025-01-11', created_at: '2025-01-11' },
    { id: '12', user_id: 'user1', blok: 'H3D', tanggal_setor: '2025-01-12', created_at: '2025-01-12' },
    { id: '13', user_id: 'user1', blok: 'H4A', tanggal_setor: '2025-01-13', created_at: '2025-01-13' },
    { id: '14', user_id: 'user1', blok: 'H4B', tanggal_setor: '2025-01-14', created_at: '2025-01-14' },
    { id: '15', user_id: 'user1', blok: 'H4C', tanggal_setor: '2025-01-15', created_at: '2025-01-15' },
    { id: '16', user_id: 'user1', blok: 'H4D', tanggal_setor: '2025-01-16', created_at: '2025-01-16' },
  ];

  console.log(`\nJurnal records to process: ${jurnalRecords.length}`);

  // Calculate weekly status
  const weeklyStatus = calculateWeeklyStatus(allBlocks, jurnalRecords);

  console.log('\n========================================');
  console.log('FINAL RESULT (should match UI):');
  console.log('========================================');
  weeklyStatus.forEach(week => {
    const display = week.is_completed ? '✓' : `${week.completed_blocks}/4`;
    console.log(`P${week.week_number}: ${display}`);
  });

  console.log('\n========================================');
  console.log('EXPECTED (from database):');
  console.log('========================================');
  console.log('P1: ✓ (4/4 blocks: H1A, H1B, H1C, H1D)');
  console.log('P2: ✓ (4/4 blocks: H2A, H2B, H2C, H2D)');
  console.log('P3: ✓ (4/4 blocks: H3A, H3B, H3C, H3D)');
  console.log('P4: ✓ (4/4 blocks: H4A, H4B, H4C, H4D)');

  console.log('\n========================================');
  console.log('ACTUAL UI SHOWS:');
  console.log('========================================');
  console.log('P1: 0/4 ❌');
  console.log('P2: 1/4 ❌');
  console.log('P3: ✓ ✅');
  console.log('P4: ✓ ✅');
}

// Run the test
testAamUmmuRifki();
