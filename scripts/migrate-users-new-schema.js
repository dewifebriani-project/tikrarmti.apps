/**
 * MIGRASI USERS TABLE → NEW PROJECT SCHEMA
 *
 * Script ini mengkonversi CSV export dari project LAMA ke SQL INSERT
 * yang kompatibel dengan schema project BARU.
 *
 * Perbedaan utama (OLD → NEW):
 *  - DIHAPUS: is_blacklisted, blacklist_reason, blacklisted_at, blacklist_notes, blacklist_by, name
 *  - NOT NULL enforcement: tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar, jenis_kelamin, negara
 *    (data lama yang NULL akan diganti dengan default placeholder)
 *
 * Cara pakai:
 *   1. Export users table dari project lama sebagai CSV (Supabase → Table Editor → Download CSV)
 *   2. Simpan sebagai scripts/users_rows.csv
 *   3. node scripts/migrate-users-new-schema.js
 *   4. Jalankan output file users_insert_new_schema.sql di project baru
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'users_rows.csv');
const outputPath = path.join(__dirname, 'users_insert_new_schema.sql');

if (!fs.existsSync(csvPath)) {
  console.error('❌ File tidak ditemukan: scripts/users_rows.csv');
  console.error('   Export dulu dari Supabase lama → Table Editor → users → Download CSV');
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());

const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

const colIndex = {};
headers.forEach((h, i) => {
  colIndex[h] = i;
});

// Parse CSV row — handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeSQL(str) {
  if (str === null || str === undefined || str === '') return 'NULL';
  return "'" + str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '') + "'";
}

function parseRoles(rolesStr) {
  if (!rolesStr || rolesStr === '' || rolesStr === 'NULL' || rolesStr === '{}') return "'{}'";
  let cleaned = rolesStr.replace(/^\["|"\]$/g, '').replace(/""/g, '"');
  if (cleaned === '') return "'{}'";
  const elements = cleaned.split(',').map(e => e.trim().replace(/^"|"$/g, '')).filter(e => e);
  if (elements.length === 0) return "'{}'";
  return `ARRAY[${elements.map(e => escapeSQL(e)).join(', ')}]::text[]`;
}

function getVal(values, colName) {
  const idx = colIndex[colName];
  return (idx !== undefined && values[idx]) ? values[idx].trim() : '';
}

// NEW schema columns (blacklist columns removed, name removed)
const NEW_SCHEMA_COLUMNS = [
  'id', 'email', 'password_hash', 'full_name', 'role', 'avatar_url', 'is_active',
  'created_at', 'updated_at',
  'provinsi', 'kota', 'alamat', 'whatsapp', 'telegram', 'zona_waktu',
  'tanggal_lahir', 'tempat_lahir', 'pekerjaan', 'alasan_daftar',
  'jenis_kelamin', 'negara', 'nama_kunyah', 'roles', 'current_tikrar_batch_id'
];

const insertStatements = [];
const skippedRows = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const values = parseCSVLine(line);

  const id = escapeSQL(getVal(values, 'id'));
  const email = escapeSQL(getVal(values, 'email'));

  if (id === 'NULL' || email === 'NULL') {
    skippedRows.push(i + 1);
    continue;
  }

  const password_hash = getVal(values, 'password_hash') ? escapeSQL(getVal(values, 'password_hash')) : 'NULL';
  const full_name = escapeSQL(getVal(values, 'full_name') || '-');
  const role = escapeSQL(getVal(values, 'role') || 'thalibah');
  const avatar_url = getVal(values, 'avatar_url') ? escapeSQL(getVal(values, 'avatar_url')) : 'NULL';
  const is_active = (['true', 't', '1'].includes(getVal(values, 'is_active'))) ? 'true' : 'false';
  const created_at = getVal(values, 'created_at') ? escapeSQL(getVal(values, 'created_at')) : 'NOW()';
  const updated_at = getVal(values, 'updated_at') ? escapeSQL(getVal(values, 'updated_at')) : 'NOW()';
  const provinsi = getVal(values, 'provinsi') ? escapeSQL(getVal(values, 'provinsi')) : 'NULL';
  const kota = getVal(values, 'kota') ? escapeSQL(getVal(values, 'kota')) : 'NULL';
  const alamat = getVal(values, 'alamat') ? escapeSQL(getVal(values, 'alamat')) : 'NULL';
  const whatsapp = getVal(values, 'whatsapp') ? escapeSQL(getVal(values, 'whatsapp')) : 'NULL';
  const telegram = getVal(values, 'telegram') ? escapeSQL(getVal(values, 'telegram')) : 'NULL';
  const zona_waktu = escapeSQL(getVal(values, 'zona_waktu') || 'WIB');
  const nama_kunyah = getVal(values, 'nama_kunyah') ? escapeSQL(getVal(values, 'nama_kunyah')) : 'NULL';
  const roles = parseRoles(getVal(values, 'roles'));

  // Handle NOT NULL fields — use placeholder if empty (tanggal_lahir stays NULL since it's date)
  const tanggal_lahir_raw = getVal(values, 'tanggal_lahir');
  const tanggal_lahir = tanggal_lahir_raw ? escapeSQL(tanggal_lahir_raw) : 'NULL';

  const tempat_lahir = escapeSQL(getVal(values, 'tempat_lahir') || '[tidak diisi]');
  const pekerjaan = escapeSQL(getVal(values, 'pekerjaan') || '[tidak diisi]');
  const alasan_daftar = escapeSQL(getVal(values, 'alasan_daftar') || '[tidak diisi]');

  const jenis_kelamin_raw = getVal(values, 'jenis_kelamin');
  const jenis_kelamin = ['Perempuan', 'Laki-laki'].includes(jenis_kelamin_raw)
    ? escapeSQL(jenis_kelamin_raw)
    : "'Perempuan'";  // default for Indonesian Islamic school context

  const negara = escapeSQL(getVal(values, 'negara') || 'Indonesia');

  // current_tikrar_batch_id: only include if valid UUID, else NULL
  const current_tikrar_batch_id_raw = getVal(values, 'current_tikrar_batch_id');
  const current_tikrar_batch_id = (current_tikrar_batch_id_raw && current_tikrar_batch_id_raw.match(/^[0-9a-f-]{36}$/i))
    ? escapeSQL(current_tikrar_batch_id_raw)
    : 'NULL';

  const stmt = `INSERT INTO public.users (${NEW_SCHEMA_COLUMNS.join(', ')}) VALUES (` + [
    id, email, password_hash, full_name, role, avatar_url, is_active,
    created_at, updated_at,
    provinsi, kota, alamat, whatsapp, telegram, zona_waktu,
    tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar,
    jenis_kelamin, negara, nama_kunyah, roles, current_tikrar_batch_id
  ].join(', ') + `) ON CONFLICT (id) DO NOTHING;`;

  insertStatements.push(stmt);
}

const sqlContent = `-- =====================================================
-- MIGRASI USERS TABLE → NEW PROJECT SCHEMA
-- Generated: ${new Date().toISOString()}
-- Compatible with: lhqbqzrghdbbmstnhple (new project)
--
-- Perbedaan dari migrate-users-updated.js:
--   - EXCLUDED: is_blacklisted, blacklist_reason, blacklisted_at,
--               blacklist_notes, blacklist_by, name
--   - NOT NULL fields diisi default placeholder jika kosong:
--     tempat_lahir, pekerjaan, alasan_daftar → '[tidak diisi]'
--     jenis_kelamin → 'Perempuan'
--     negara → 'Indonesia'
--   - current_tikrar_batch_id diset NULL jika bukan UUID valid
--     (insert batches dulu sebelum menjalankan script ini
--      jika ingin preserve FK — atau update manual setelah insert)
-- =====================================================

-- Nonaktifkan constraint FK sementara (opsional, jika current_tikrar_batch_id ada)
-- SET session_replication_role = replica;

${insertStatements.join('\n\n')}

-- Aktifkan kembali constraint FK
-- SET session_replication_role = DEFAULT;

-- Verifikasi
SELECT COUNT(*) AS total_users_migrated FROM public.users;
`;

fs.writeFileSync(outputPath, sqlContent);
console.log(`✅ Generated ${insertStatements.length} INSERT statements`);
if (skippedRows.length > 0) {
  console.log(`⚠️  Skipped ${skippedRows.length} rows (missing id/email): lines ${skippedRows.join(', ')}`);
}
console.log(`📄 Output: ${outputPath}`);
console.log('');
console.log('Langkah selanjutnya:');
console.log('  1. Pastikan schema users table sudah dibuat di project baru');
console.log('  2. (Opsional) Insert batches dulu jika mau preserve current_tikrar_batch_id FK');
console.log('  3. Copy isi users_insert_new_schema.sql ke Supabase SQL Editor (project baru)');
console.log('  4. Jalankan query');
