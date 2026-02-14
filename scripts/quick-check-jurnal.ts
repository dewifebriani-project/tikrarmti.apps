/**
 * Quick Check Script untuk Jurnal Records
 * Gunakan: npm run debug:jurnal
 *
 * Script ini untuk cepat mengecek masalah 0/4 pada jurnal interface
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Environment variables tidak diset');
  console.log('Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ada di .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper: Parse blok field
function parseBlokField(blok: any): string[] {
  if (!blok) return [];
  if (typeof blok === 'string') {
    if (blok.startsWith('[')) {
      try {
        const parsed = JSON.parse(blok);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return blok.split(',').map(b => b.trim()).filter(b => b);
      }
    }
    return blok.split(',').map(b => b.trim()).filter(b => b);
  }
  if (Array.isArray(blok)) return blok;
  return [];
}

// Helper: Calculate week from blok code
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

// Expected block codes for each juz part
const EXPECTED_BLOCKS: Record<string, string[]> = {
  '30A': ['H1A', 'H1B', 'H1C', 'H1D', 'H2A', 'H2B', 'H2C', 'H2D', 'H3A', 'H3B', 'H3C', 'H3D',
          'H4A', 'H4B', 'H4C', 'H4D', 'H5A', 'H5B', 'H5C', 'H5D',
          'H6A', 'H6B', 'H6C', 'H6D', 'H7A', 'H7B', 'H7C', 'H7D',
          'H8A', 'H8B', 'H8C', 'H8D', 'H9A', 'H9B', 'H9C', 'H9D',
          'H10A', 'H10B', 'H10C', 'H10D',
          'H11A', 'H11B', 'H11C', 'H11D', 'H12A', 'H12B', 'H12C', 'H12D',
          'H13A', 'H13B', 'H13C', 'H13D', 'H14A', 'H14B', 'H14C', 'H14D',
          'H15A', 'H15B', 'H15C', 'H15D',
          'H16A', 'H16B', 'H16C', 'H16D', 'H17A', 'H17B', 'H17C', 'H17D',
          'H18A', 'H18B', 'H18C', 'H18D', 'H19A', 'H19B', 'H19C', 'H19D',
          'H20A', 'H20B', 'H20C', 'H20D'],
  '30B': ['H11A', 'H11B', 'H11C', 'H11D', 'H12A', 'H12B', 'H12C', 'H12D',
          'H13A', 'H13B', 'H13C', 'H13D', 'H14A', 'H14B', 'H14C', 'H14D',
          'H15A', 'H15B', 'H15C', 'H15D', 'H16A', 'H16B', 'H16C', 'H16D',
          'H17A', 'H17B', 'H17C', 'H17D', 'H18A', 'H18B', 'H18C', 'H18D',
          'H19A', 'H19B', 'H19C', 'H19D', 'H20A', 'H20B', 'H20C', 'H20D'],
};

async function quickCheck() {
  console.log('⚡ Quick Check Jurnal Records\n');

  // Get total jurnal records
  const { data: allJurnal, error: jurnalError } = await supabase
    .from('jurnal_records')
    .select('id, user_id, blok, juz_code, tanggal_setor, created_at')
    .order('created_at', { ascending: false });

  if (jurnalError) {
    console.error('❌ Error:', jurnalError);
    return;
  }

  console.log(`📊 Total jurnal records: ${allJurnal?.length || 0}\n`);

  if (!allJurnal || allJurnal.length === 0) {
    console.log('⚠️ No jurnal records found');
    return;
  }

  // Analyze blok field format
  console.log('🔍 Blok Field Format Analysis:');
  const formatCounts = {
    singleString: 0,
    jsonString: 0,
    array: 0,
    empty: 0,
    invalid: 0,
  };

  const blokValues: string[] = [];

  allJurnal.forEach(record => {
    const blok = record.blok;

    if (!blok) {
      formatCounts.empty++;
    } else if (typeof blok === 'string') {
      if (blok.startsWith('[')) {
        formatCounts.jsonString++;
        try {
          const parsed = JSON.parse(blok);
          if (Array.isArray(parsed)) {
            parsed.forEach(b => blokValues.push(b));
          }
        } catch {}
      } else {
        formatCounts.singleString++;
        blokValues.push(blok);
      }
    } else if (Array.isArray(blok)) {
      formatCounts.array++;
      blok.forEach(b => blokValues.push(b));
    } else {
      formatCounts.invalid++;
    }
  });

  console.log(`   Empty/Null: ${formatCounts.empty}`);
  console.log(`   Single String: ${formatCounts.singleString}`);
  console.log(`   JSON String Array: ${formatCounts.jsonString}`);
  console.log(`   Array: ${formatCounts.array}`);
  console.log(`   Invalid: ${formatCounts.invalid}\n`);

  // Unique blok values
  const uniqueBloks = Array.from(new Set(blokValues)).sort();
  console.log(`📋 Unique Blok Values (${uniqueBloks.length}):`);
  console.log(`   ${uniqueBloks.join(', ')}\n`);

  // Analyze week distribution
  console.log('📅 Week Distribution (from blok codes):');
  const weekCounts: Record<number, number> = {};

  allJurnal.forEach(record => {
    const week = calculateWeekFromBlok(record.blok);
    if (week) {
      weekCounts[week] = (weekCounts[week] || 0) + 1;
    }
  });

  for (let week = 1; week <= 10; week++) {
    const count = weekCounts[week] || 0;
    const status = count === 0 ? '❌' : count >= 4 ? '✅' : '⚠️';
    console.log(`   ${status} Week ${week}: ${count} records`);
  }
  console.log('');

  // Check specific issues
  console.log('🔬 Potential Issues:\n');

  // Issue 1: Empty blok field
  if (formatCounts.empty > 0) {
    console.log(`⚠️ ISSUE 1: ${formatCounts.empty} records dengan blok kosong/null`);
    console.log('   Query: SELECT id, user_id FROM jurnal_records WHERE blok IS NULL;\n');
  }

  // Issue 2: Invalid blok format (doesn't match H[1-20][A-D])
  const invalidBloks = uniqueBloks.filter(b => !/^H\d+[A-D]$/.test(b));
  if (invalidBloks.length > 0) {
    console.log(`⚠️ ISSUE 2: Blok format tidak valid: ${invalidBloks.join(', ')}`);
    console.log('   Expected format: H1A, H1B, H1C, H1D, H2A, etc.\n');
  }

  // Issue 3: Blok not matching expected blocks for juz
  const { data: daftarUlang } = await supabase
    .from('daftar_ulang_submissions')
    .select('user_id, confirmed_chosen_juz')
    .in('status', ['approved', 'submitted']);

  const juzByUser = new Map(daftarUlang?.map(d => [d.user_id, d.confirmed_chosen_juz]) || []);

  console.log('👤 Per-User Analysis:');
  const userRecords = new Map<string, any[]>();
  allJurnal.forEach(r => {
    if (!userRecords.has(r.user_id)) userRecords.set(r.user_id, []);
    userRecords.get(r.user_id)!.push(r);
  });

  for (const [userId, records] of userRecords) {
    const userJuz = juzByUser.get(userId) || 'Unknown';
    const userBloks = records.flatMap(r => parseBlokField(r.blok));

    // Get expected blocks for this juz
    const expectedBlocks = EXPECTED_BLOCKS[userJuz] || [];
    const matchingBlocks = userBloks.filter(b => expectedBlocks.includes(b));

    if (userBloks.length > 0 && matchingBlocks.length === 0) {
      console.log(`   ❌ User ${userId} (Juz ${userJuz}):`);
      console.log(`      Has ${records.length} records but blok [${userBloks.join(', ')}] doesn't match expected blocks`);
    } else if (matchingBlocks.length < userBloks.length) {
      const nonMatching = userBloks.filter(b => !expectedBlocks.includes(b));
      console.log(`   ⚠️ User ${userId} (Juz ${userJuz}):`);
      console.log(`      Some blok don't match: [${nonMatching.join(', ')}]`);
    }
  }

  console.log('\n✅ Quick Check Complete!\n');
  console.log('💡 Rekomendasi:');
  console.log('   1. Jika ada blok kosong, update data dengan blok yang valid');
  console.log('   2. Jika format blok tidak sesuai, gunakan format H1A, H1B, dll.');
  console.log('   3. Pastikan blok sesuai dengan juz yang dipilih thalibah\n');
}

quickCheck().catch(console.error);
