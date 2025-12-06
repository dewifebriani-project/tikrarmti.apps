# Dukungan Pengguna Internasional

## Ringkasan
Aplikasi Tikrar MTI sekarang mendukung pendaftaran peserta dari luar Indonesia, termasuk Malaysia dan Australia.

## Perubahan yang Dilakukan

### 1. **Frontend - Halaman Register** (`app/register/page.tsx`)

#### Field Baru:
- **Negara**: Dropdown untuk memilih negara
  - Indonesia
  - Malaysia
  - Australia
  - Negara Lainnya

#### Logika Conditional:
- **Provinsi**: Hanya ditampilkan jika user memilih "Indonesia"
- **Zona Waktu**: Difilter otomatis berdasarkan negara yang dipilih

#### Zona Waktu yang Didukung:

**Indonesia:**
- WIB (UTC+7) - Indonesia Barat
- WITA (UTC+8) - Indonesia Tengah
- WIT (UTC+9) - Indonesia Timur

**Malaysia:**
- MYT (UTC+8) - Malaysia Time

**Australia:**
- AWST (UTC+8) - Australia Barat
- ACST (UTC+9:30) - Australia Tengah
- AEST (UTC+10) - Australia Timur

**Lainnya:**
- OTHER - Zona Waktu Lainnya

### 2. **Backend - API Register** (`app/api/auth/register/route.ts`)

#### Validasi Baru:
```typescript
// Provinsi WAJIB hanya untuk Indonesia
if (negara === 'Indonesia' && !provinsi) {
  return error('Provinsi wajib diisi untuk pendaftar dari Indonesia');
}

// Zona waktu yang valid diperluas
const validTimezones = ['WIB', 'WITA', 'WIT', 'MYT', 'AWST', 'ACST', 'AEST', 'OTHER'];
```

#### Data yang Disimpan:
- **negara**: VARCHAR(100), NOT NULL
- **provinsi**: VARCHAR(100), nullable (untuk non-Indonesia)

### 3. **Database Migration** (`migrations/add_negara_column_to_users.sql`)

#### Perubahan Schema:
```sql
-- Tambah kolom negara
ALTER TABLE users ADD COLUMN negara VARCHAR(100) NOT NULL;

-- Set default untuk user existing
UPDATE users SET negara = 'Indonesia' WHERE negara IS NULL;

-- Provinsi sekarang nullable
ALTER TABLE users ALTER COLUMN provinsi DROP NOT NULL;

-- Index untuk performa
CREATE INDEX idx_users_negara ON users(negara);
```

## Cara Menjalankan Migration

```bash
# Menggunakan Supabase CLI
npx supabase db push

# Atau jalankan manual di Supabase Dashboard
# Copy isi file migrations/add_negara_column_to_users.sql
# Paste di SQL Editor di Supabase Dashboard
# Klik "Run"
```

## User Experience

### Untuk Peserta Indonesia:
1. Pilih "Indonesia" di field Negara
2. Field "Provinsi" akan muncul (wajib diisi)
3. Zona waktu hanya menampilkan WIB, WITA, WIT
4. Helper text: "Pilih WIB, WITA, atau WIT sesuai lokasi Ukhti"

### Untuk Peserta Malaysia:
1. Pilih "Malaysia" di field Negara
2. Field "Provinsi" TIDAK muncul
3. Zona waktu otomatis hanya menampilkan MYT
4. Helper text: "Malaysia menggunakan MYT (sama dengan WITA)"

### Untuk Peserta Australia:
1. Pilih "Australia" di field Negara
2. Field "Provinsi" TIDAK muncul
3. Zona waktu menampilkan AWST, ACST, AEST
4. Helper text: "Pilih zona waktu sesuai wilayah di Australia"

### Untuk Peserta Negara Lainnya:
1. Pilih "Negara Lainnya" di field Negara
2. Field "Provinsi" TIDAK muncul
3. Zona waktu menampilkan semua opsi
4. Helper text: "Pilih zona waktu yang paling sesuai atau pilih 'Zona Waktu Lainnya'"

## Keuntungan Solusi Ini

### 1. **User-Friendly untuk Indonesia**
- Peserta Indonesia tetap mendapatkan pengalaman yang detail
- Provinsi tetap wajib diisi untuk data yang lengkap
- Zona waktu familiar (WIB, WITA, WIT)

### 2. **Mudah untuk International**
- Tidak dipaksa mengisi provinsi yang tidak relevan
- Zona waktu sesuai dengan negara masing-masing
- Proses pendaftaran lebih cepat

### 3. **Smart Auto-Filtering**
- Zona waktu difilter otomatis berdasarkan negara
- Mengurangi kebingungan user
- Mencegah input zona waktu yang salah

### 4. **Scalable**
- Mudah menambahkan negara baru
- Mudah menambahkan zona waktu baru
- Struktur data yang fleksibel

## Contoh Kasus Penggunaan

### Kasus 1: Peserta dari Jakarta
```
Negara: Indonesia
Provinsi: DKI Jakarta
Kota: Jakarta Pusat
Zona Waktu: WIB (UTC+7)
```

### Kasus 2: Peserta dari Kuala Lumpur
```
Negara: Malaysia
Provinsi: (tidak ditampilkan)
Kota: Kuala Lumpur
Zona Waktu: MYT (UTC+8)
```

### Kasus 3: Peserta dari Sydney
```
Negara: Australia
Provinsi: (tidak ditampilkan)
Kota: Sydney
Zona Waktu: AEST (UTC+10)
```

## Testing Checklist

- [ ] Test pendaftaran peserta Indonesia (harus isi provinsi)
- [ ] Test pendaftaran peserta Malaysia (tidak ada field provinsi)
- [ ] Test pendaftaran peserta Australia (tidak ada field provinsi)
- [ ] Test auto-filtering zona waktu per negara
- [ ] Test reset zona waktu saat ganti negara
- [ ] Test validasi di backend
- [ ] Test migrasi database
- [ ] Test tampilan di mobile dan desktop

## Catatan Penting

1. **Data Existing**: Semua user existing akan otomatis diset dengan negara = "Indonesia"
2. **Backward Compatibility**: Aplikasi tetap berjalan normal untuk user existing
3. **Validasi**: Backend akan reject jika user Indonesia tidak mengisi provinsi
4. **Performance**: Index ditambahkan untuk query by country yang lebih cepat

## Troubleshooting

### Error: "Provinsi wajib diisi"
- Pastikan user memilih negara "Indonesia"
- Jika bukan Indonesia, provinsi bisa dikosongkan

### Zona waktu tidak muncul
- Pastikan user sudah memilih negara terlebih dahulu
- Refresh halaman jika masalah persists

### Migration gagal
- Pastikan koneksi ke database stabil
- Check apakah kolom negara sudah ada (jangan run 2x)
- Backup database sebelum menjalankan migration

## Future Improvements

1. Tambahkan lebih banyak negara (Singapura, Brunei, dll)
2. Auto-detect timezone dari browser
3. Validasi kota berdasarkan negara
4. Multi-language support
