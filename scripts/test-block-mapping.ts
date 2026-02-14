/**
 * Test Script untuk memverifikasi block mapping yang benar
 * Gunakan: npx tsx scripts/test-block-mapping.ts
 *
 * Script ini untuk memastikan generateAllBlocks dan calculateWeekFromBlok konsisten
 */

// Simulate functions from route.ts

function calculateWeekFromBlok(blok: string | null): number | null {
  if (!blok) return null;

  let blokCode: string | null = blok;

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

  const match = blokCode.match(/H(\d+)/);
  if (!match) return null;

  const blockNumber = parseInt(match[1], 10);

  if (blockNumber >= 1 && blockNumber <= 10) {
    return blockNumber;
  } else if (blockNumber >= 11 && blockNumber <= 20) {
    return blockNumber - 10;
  }

  return null;
}

function generateAllBlocks(juzInfo: any) {
  const allBlocks: any[] = [];
  const parts = ['A', 'B', 'C', 'D'];
  const blockOffset = juzInfo.part === 'B' ? 10 : 0;

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
        is_completed: false,
        jurnal_count: 0
      });
    }
  }

  return allBlocks;
}

// Test cases
console.log('🧪 Testing Block Mapping Consistency\n');
console.log('='.repeat(80));

// Test Part A (Juz 30A)
console.log('\n📖 Test: Juz 30A (Part A)\n');
const juz30A = { code: '30A', part: 'A', start_page: 583, end_page: 587 };
const blocks30A = generateAllBlocks(juz30A);

console.log(`Total blocks generated: ${blocks30A.length}`);
console.log(`Expected: 40 blocks (10 weeks × 4 blocks)\n`);

console.log('Week 1 blocks:');
const week1BlocksA = blocks30A.filter(b => b.week_number === 1);
week1BlocksA.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 1 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 1)`);
});

console.log('\nWeek 5 blocks:');
const week5BlocksA = blocks30A.filter(b => b.week_number === 5);
week5BlocksA.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 5 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 5)`);
});

console.log('\nWeek 10 blocks:');
const week10BlocksA = blocks30A.filter(b => b.week_number === 10);
week10BlocksA.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 10 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 10)`);
});

// Test Part B (Juz 30B)
console.log('\n📖 Test: Juz 30B (Part B)\n');
const juz30B = { code: '30B', part: 'B', start_page: 588, end_page: 604 };
const blocks30B = generateAllBlocks(juz30B);

console.log(`Total blocks generated: ${blocks30B.length}`);
console.log(`Expected: 40 blocks (10 weeks × 4 blocks)\n`);

console.log('Week 1 blocks:');
const week1BlocksB = blocks30B.filter(b => b.week_number === 1);
week1BlocksB.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 1 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 1)`);
});

console.log('\nWeek 5 blocks:');
const week5BlocksB = blocks30B.filter(b => b.week_number === 5);
week5BlocksB.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 5 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 5)`);
});

console.log('\nWeek 10 blocks:');
const week10BlocksB = blocks30B.filter(b => b.week_number === 10);
week10BlocksB.forEach(b => {
  const calculatedWeek = calculateWeekFromBlok(b.block_code);
  const match = calculatedWeek === 10 ? '✅' : '❌';
  console.log(`  ${match} ${b.block_code} -> Week ${calculatedWeek} (expected: 10)`);
});

// Test mapping consistency
console.log('\n🔍 Test: Mapping Consistency Check\n');

let allMatch = true;
const allBlocks = blocks30A.concat(blocks30B);
for (const block of allBlocks) {
  const calculatedWeek = calculateWeekFromBlok(block.block_code);
  if (calculatedWeek !== block.week_number) {
    console.log(`❌ MISMATCH: ${block.block_code} -> Generated Week ${block.week_number}, Calculated Week ${calculatedWeek}`);
    allMatch = false;
  }
}

if (allMatch) {
  console.log('✅ All blocks are consistent! generateAllBlocks() and calculateWeekFromBlok() match perfectly.');
} else {
  console.log('❌ Found mismatches between generateAllBlocks() and calculateWeekFromBlok()');
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ Test Complete!\n');
