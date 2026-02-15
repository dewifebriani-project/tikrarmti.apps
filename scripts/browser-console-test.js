/**
 * BROWSER CONSOLE TEST
 * Open the musyrifah panel page, then open DevTools Console (F12)
 * Paste this code to check the actual API response
 */

// Copy this code and paste it in the browser console when on the musyrifah panel page
// This will intercept the API call and show the actual response

(async function checkAPIResponse() {
  console.log('========================================');
  console.log('Checking Jurnal API Response...');
  console.log('========================================');

  // Fetch the API data
  const response = await fetch('/api/musyrifah/jurnal');
  const data = await response.json();

  console.log('Response success:', data.success);
  console.log('Total entries:', data.data?.length);

  // Find Aam Ummu Rifki's entry
  const aamEntry = data.data?.find(e => e.user?.full_name?.includes('Aam'));

  if (!aamEntry) {
    console.error('Could not find Aam Ummu Rifki entry');
    return;
  }

  console.log('\n========================================');
  console.log('Aam Ummu Rifki - Weekly Status:');
  console.log('========================================');

  aamEntry.weekly_status?.slice(0, 4).forEach((week, index) => {
    const weekNum = index + 1;
    const display = week.is_completed ? '✓' : `${week.completed_blocks}/4`;
    console.log(`P${weekNum}: ${display} (${week.completed_blocks}/${week.total_blocks} blocks)`);

    // Show individual block status
    console.log(`  Blocks:`, week.blocks.map(b => ({
      code: b.block_code,
      completed: b.is_completed
    })));
  });

  console.log('\n========================================');
  console.log('Expected (from debug script):');
  console.log('========================================');
  console.log('P1: ✓ (4/4)');
  console.log('P2: ✓ (4/4)');
  console.log('P3: ✓ (4/4)');
  console.log('P4: ✓ (4/4)');

  console.log('\n========================================');
  console.log('UI Shows (from screenshot):');
  console.log('========================================');
  console.log('P1: 0/4 ❌');
  console.log('P2: 1/4 ❌');
  console.log('P3: ✓ ✅');
  console.log('P4: ✓ ✅');

  console.log('\n========================================');
  console.log('Mismatch Analysis:');
  console.log('========================================');

  const mismatches = [];
  aamEntry.weekly_status?.slice(0, 4).forEach((week, index) => {
    const weekNum = index + 1;
    const expectedCompleted = 4; // All should be 4/4
    const actualCompleted = week.completed_blocks;

    if (actualCompleted !== expectedCompleted) {
      mismatches.push({
        week: weekNum,
        expected: expectedCompleted,
        actual: actualCompleted,
        blocks: week.blocks.map(b => ({
          code: b.block_code,
          completed: b.is_completed
        }))
      });
    }
  });

  if (mismatches.length > 0) {
    console.log('MISMATCHES FOUND:', mismatches);
  } else {
    console.log('NO MISMATCHES - API is returning correct data!');
    console.log('If UI still shows wrong values, the issue is in the FRONTEND rendering.');
  }

  return data;
})();
