/**
 * MIGRASI USERS TABLE
 * Convert CSV ke SQL INSERT statements
 *
 * Run: node scripts/migrate-users.js
 */

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'users_rows.csv');
const outputPath = path.join(__dirname, 'users_insert.sql');

// Read CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split('\n').filter(l => l.trim());

// Get headers
const headers = lines[0].split(',');

// Find column indices
const colIndex = {
  id: headers.indexOf('id'),
  email: headers.indexOf('email'),
  password_hash: headers.indexOf('password_hash'),
  full_name: headers.indexOf('full_name'),
  role: headers.indexOf('role'),
  avatar_url: headers.indexOf('avatar_url'),
  is_active: headers.indexOf('is_active'),
  created_at: headers.indexOf('created_at'),
  updated_at: headers.indexOf('updated_at'),
  provinsi: headers.indexOf('provinsi'),
  kota: headers.indexOf('kota'),
  alamat: headers.indexOf('alamat'),
  whatsapp: headers.indexOf('whatsapp'),
  telegram: headers.indexOf('telegram'),
  zona_waktu: headers.indexOf('zona_waktu'),
  tanggal_lahir: headers.indexOf('tanggal_lahir'),
  tempat_lahir: headers.indexOf('tempat_lahir'),
  pekerjaan: headers.indexOf('pekerjaan'),
  alasan_daftar: headers.indexOf('alasan_daftar'),
  jenis_kelamin: headers.indexOf('jenis_kelamin'),
  negara: headers.indexOf('negara'),
  nama_kunyah: headers.indexOf('nama_kunyah'),
  roles: headers.indexOf('roles'),
  current_tikrar_batch_id: headers.indexOf('current_tikrar_batch_id'),
  is_blacklisted: headers.indexOf('is_blacklisted'),
};

// Parse CSV row (handle quoted fields with newlines)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
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

// Escape SQL string
function escapeSQL(str) {
  if (str === null || str === undefined || str === '') return 'NULL';
  return "'" + str.replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

// Convert roles array from CSV to PostgreSQL array format
function parseRoles(rolesStr) {
  if (!rolesStr || rolesStr === '' || rolesStr === 'NULL') return "'{}'";

  // Remove outer brackets and quotes
  let cleaned = rolesStr
    .replace(/^\["/, '')
    .replace(/"\]$/, '')
    .replace(/""/g, '"');  // Unescape double quotes

  if (cleaned === '') return "'{}'";

  // Split by comma and wrap each element
  const elements = cleaned.split(',').map(e => e.trim()).filter(e => e);
  if (elements.length === 0) return "'{}'";

  return `ARRAY[${elements.map(e => escapeSQL(e)).join(', ')}]::text[]`;
}

// Process rows
const insertStatements = [];

// Skip header row (line 0)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  const values = parseCSVLine(line);

  const id = values[colIndex.id] || 'gen_random_uuid()';
  const email = escapeSQL(values[colIndex.email]);
  const password_hash = values[colIndex.password_hash] ? escapeSQL(values[colIndex.password_hash]) : 'NULL';
  const full_name = escapeSQL(values[colIndex.full_name]);
  const role = escapeSQL(values[colIndex.role] || 'thalibah');
  const avatar_url = values[colIndex.avatar_url] ? escapeSQL(values[colIndex.avatar_url]) : 'NULL';
  const is_active = (values[colIndex.is_active] === 'true' || values[colIndex.is_active] === 't') ? 'true' : 'false';
  const created_at = values[colIndex.created_at] ? escapeSQL(values[colIndex.created_at]) : 'NOW()';
  const updated_at = values[colIndex.updated_at] ? escapeSQL(values[colIndex.updated_at]) : 'NOW()';
  const provinsi = values[colIndex.provinsi] ? escapeSQL(values[colIndex.provinsi]) : 'NULL';
  const kota = values[colIndex.kota] ? escapeSQL(values[colIndex.kota]) : 'NULL';
  const alamat = values[colIndex.alamat] ? escapeSQL(values[colIndex.alamat]) : 'NULL';
  const whatsapp = values[colIndex.whatsapp] ? escapeSQL(values[colIndex.whatsapp]) : 'NULL';
  const telegram = values[colIndex.telegram] ? escapeSQL(values[colIndex.telegram]) : 'NULL';
  const zona_waktu = values[colIndex.zona_waktu] ? escapeSQL(values[colIndex.zona_waktu]) : "'WIB'";
  const tanggal_lahir = values[colIndex.tanggal_lahir] && values[colIndex.tanggal_lahir] !== '' ? escapeSQL(values[colIndex.tanggal_lahir]) : 'NULL';
  const tempat_lahir = values[colIndex.tempat_lahir] ? escapeSQL(values[colIndex.tempat_lahir]) : 'NULL';
  const pekerjaan = values[colIndex.pekerjaan] ? escapeSQL(values[colIndex.pekerjaan]) : 'NULL';
  const alasan_daftar = values[colIndex.alasan_daftar] ? escapeSQL(values[colIndex.alasan_daftar]) : 'NULL';
  const jenis_kelamin = values[colIndex.jenis_kelamin] ? escapeSQL(values[colIndex.jenis_kelamin]) : 'NULL';
  const negara = values[colIndex.negara] ? escapeSQL(values[colIndex.negara]) : 'NULL';
  const nama_kunyah = values[colIndex.nama_kunyah] ? escapeSQL(values[colIndex.nama_kunyah]) : 'NULL';
  const roles = parseRoles(values[colIndex.roles]);
  const current_tikrar_batch_id = values[colIndex.current_tikrar_batch_id] && values[colIndex.current_tikrar_batch_id] !== ''
    ? escapeSQL(values[colIndex.current_tikrar_batch_id])
    : 'NULL';
  const is_blacklisted = (values[colIndex.is_blacklisted] === 'true' || values[colIndex.is_blacklisted] === 't') ? 'true' : 'false';

  const insertStmt = `INSERT INTO public.users (id, email, password_hash, full_name, role, avatar_url, is_active, is_blacklisted, created_at, updated_at, provinsi, kota, alamat, whatsapp, telegram, zona_waktu, tanggal_lahir, tempat_lahir, pekerjaan, alasan_daftar, jenis_kelamin, negara, nama_kunyah, roles, current_tikrar_batch_id) VALUES (${id}, ${email}, ${password_hash}, ${full_name}, ${role}, ${avatar_url}, ${is_active}, ${is_blacklisted}, ${created_at}, ${updated_at}, ${provinsi}, ${kota}, ${alamat}, ${whatsapp}, ${telegram}, ${zona_waktu}, ${tanggal_lahir}, ${tempat_lahir}, ${pekerjaan}, ${alasan_daftar}, ${jenis_kelamin}, ${negara}, ${nama_kunyah}, ${roles}, ${current_tikrar_batch_id}) ON CONFLICT (id) DO NOTHING;`;

  insertStatements.push(insertStmt);
}

// Write to SQL file
const sqlContent = `-- =====================================================
-- MIGRASI USERS TABLE
-- Generated from CSV export
-- Run in Project BARU: https://lhqbqzrghdbbmstnhple.supabase.co
-- =====================================================

${insertStatements.join('\n\n')}

-- Verify count
SELECT COUNT(*) as total_users FROM public.users;
`;

fs.writeFileSync(outputPath, sqlContent);
console.log(`✅ Generated ${insertStatements.length} INSERT statements`);
console.log(`📄 Output: ${outputPath}`);
console.log(`\nNext steps:`);
console.log(`1. Copy contents of ${outputPath}`);
console.log(`2. Paste in Supabase SQL Editor (project BARU)`);
console.log(`3. Run the query`);
