# Alur Registrasi dan Pendaftaran - Perbaikan Role Management

## 📋 Masalah Awal
User yang registrasi langsung mendapat role 'thalibah' tanpa mendaftar program di `/app/pendaftaran`, menyebabkan ketidak konsistensi status.

## 🎯 Solusi yang Diterapkan

### 1. ✅ Tambah Role 'calon_thalibah'
- **TypeScript Types**: Updated di `types/database.ts`
- **Supabase Schema**: Updated di `lib/supabase.ts`
- **Default Role**: Registrasi sekarang default ke 'calon_thalibah'

### 2. ✅ Update Logic Registrasi
- **auth.ts**: `registerWithEmail()` default role = 'calon_thalibah'
- **Validation**: Hanya user 'thalibah' yang sudah approved yang bisa login
- **Role Check**: Fungsi `checkUserApprovedForThalibah()` untuk validasi login

### 3. ✅ Logic Pendaftaran & Upgrade
- **pendaftaran.ts**: Fungsi `upgradeUserRoleToThalibah()`
- **Auto Upgrade**: Saat pendaftaran disetujui, role otomatis upgrade ke 'thalibah'
- **Approval Flow**: Admin approve pendaftaran → user role auto-upgrade

### 4. ✅ Database Constraints
- **Manual Fix Required**: Constraint database perlu diupdate
- **SQL Script**: `scripts/fix-database-constraints.sql`

## 🔧 Tindakan Manual yang Diperlukan

### 1. Update Database Constraints
Jalankan SQL ini di Supabase Dashboard:

```sql
-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes 'calon_thalibah'
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'musyrifah', 'muallimah', 'calon_thalibah', 'thalibah'));
```

### 2. Update Role User yang Sudah Ada
Setelah constraint diperbaiki, jalankan:
```bash
node scripts/fix-user-roles.js
```

## 🔄 Alur yang Baru

### Registrasi User Baru
1. **Register Email** → User dibuat dengan role 'calon_thalibah'
2. **Login Pertama** → Dicek:
   - ✅ Jika 'calon_thalibah' → Boleh login untuk mengisi pendaftaran
   - ❌ Jika 'thalibah' → Harus ada pendaftaran approved
3. **Isi Pendaftaran** → Submit formulir di `/app/pendaftaran`
4. **Admin Review** → Approve/Reject pendaftaran
5. **Auto Upgrade** → Jika approved, role auto upgrade ke 'thalibah'

### Login Logic
- **'calon_thalibah'** → Boleh login, tapi harus mendaftar program
- **'thalibah'** → Boleh login (sudah approved)
- **'admin', 'musyrifah', 'muallimah'** → Boleh login

## 📊 Status Implementation

| Task | Status | Description |
|------|--------|-------------|
| ✅ Type Definitions | Done | 'calon_thalibah' ditambahkan ke UserRole |
| ✅ Supabase Schema | Done | Database types updated |
| ✅ Registrasi Logic | Done | Default role 'calon_thalibah' |
| ✅ Pendaftaran Logic | Done | Auto upgrade ke 'thalibah' |
| ⚠️ Database Constraints | Manual | SQL script ready but perlu dijalankan manual |
| ⏳ Testing | Pending | Tunggu constraint fix untuk testing |

## 🧪 Testing Plan

Setelah database constraints diperbaiki:

1. **Test Registrasi Baru**:
   - Register user baru
   - Cek role = 'calon_thalibah'
   - Login harus berhasil

2. **Test Pendaftaran**:
   - User 'calon_thalibah' isi pendaftaran
   - Admin approve pendaftaran
   - Cek role auto-upgrade ke 'thalibah'

3. **Test Login Logic**:
   - 'calon_thalibah' tanpa pendaftaran → Boleh login
   - 'thalibah' tanpa pendaftaran → Tidak boleh login (error message)

## 📝 Files yang Dimodifikasi

1. `types/database.ts` - Add 'calon_thalibah' role
2. `lib/supabase.ts` - Update schema definitions
3. `lib/auth.ts` - Update registrasi & login logic
4. `lib/pendaftaran.ts` - Add role upgrade functions
5. `scripts/fix-user-roles.js` - Fix existing user roles
6. `scripts/fix-database-constraints.sql` - Update database constraints