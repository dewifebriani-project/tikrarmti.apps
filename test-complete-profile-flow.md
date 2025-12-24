# Test Plan - Complete Profile Flow

## Server Running
- URL: http://localhost:3002
- Status: ✅ Ready

## Test Scenarios

### Scenario 1: User Baru OAuth (Profil Belum Lengkap)
**Expected Flow:**
1. Login via OAuth (Google/etc) - user hanya punya email di auth
2. User tidak ada di tabel `users`
3. Buka `/pendaftaran/tikrar-tahfidz`
4. Isi form pendaftaran
5. Submit form
6. Backend validasi → User tidak ditemukan di `users` table
7. Error muncul: "Profil Anda belum lengkap. Silakan lengkapi profil terlebih dahulu."
8. Auto-redirect ke `/lengkapi-profile` dalam 2 detik
9. User isi form lengkapi profil (tanggal_lahir, tempat_lahir, pekerjaan, dll)
10. Submit → Data tersimpan
11. Redirect ke `/dashboard`
12. Buka `/pendaftaran/tikrar-tahfidz` lagi
13. Submit form → ✅ Berhasil

**API Endpoints Tested:**
- `POST /api/pendaftaran/submit` - Should return 400 with redirect
- `POST /api/user/profile/complete` - Should create user with complete data
- `GET /api/auth/me` - Should return complete user data

**Validation Points:**
- ✅ Error response has `redirect` field
- ✅ Error message is clear
- ✅ Frontend auto-redirects to `/lengkapi-profile`
- ✅ Form pre-fills existing data
- ✅ All required fields validated
- ✅ User created in `users` table with all fields
- ✅ User metadata updated in auth
- ✅ Second submit succeeds

---

### Scenario 2: User Existing dengan Profil Tidak Lengkap
**Expected Flow:**
1. User sudah ada di `users` table
2. Tapi field required kosong (misal: `tempat_lahir`, `pekerjaan`)
3. Buka `/pendaftaran/tikrar-tahfidz`
4. Submit form
5. Backend validasi → User ada tapi field kosong
6. Error: "Profil Anda belum lengkap. Field yang masih kosong: tempat_lahir, pekerjaan"
7. Auto-redirect ke `/lengkapi-profile`
8. Form pre-fill data yang sudah ada
9. User lengkapi field yang kosong
10. Submit → Update user
11. Submit form pendaftaran → ✅ Berhasil

**API Endpoints Tested:**
- `POST /api/pendaftaran/submit` - Should return 400 with missing fields list
- `POST /api/user/profile/complete` - Should update existing user

**Validation Points:**
- ✅ Error shows specific missing fields
- ✅ Form pre-fills existing data
- ✅ Update works correctly
- ✅ All NOT NULL constraints satisfied

---

### Scenario 3: User Lengkap Langsung Submit
**Expected Flow:**
1. User sudah register lengkap via `/register`
2. Semua field required sudah terisi
3. Buka `/pendaftaran/tikrar-tahfidz`
4. Submit form → ✅ Berhasil langsung

**API Endpoints Tested:**
- `POST /api/pendaftaran/submit` - Should succeed (200)

**Validation Points:**
- ✅ No validation errors
- ✅ Data inserted to `pendaftaran_tikrar_tahfidz`
- ✅ Success message shown

---

## Manual Test Steps

### Test 1: Access Lengkapi Profile Page
```bash
# 1. Login terlebih dahulu
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Access lengkapi-profile page (should work if authenticated)
# Open browser: http://localhost:3002/lengkapi-profile
```

### Test 2: Submit Without Complete Profile
```bash
# This will be done via browser since it requires authentication cookie
# 1. Login
# 2. Go to /pendaftaran/tikrar-tahfidz
# 3. Fill form and submit
# 4. Observe error and redirect
```

### Test 3: Complete Profile Submission
```bash
# Via browser:
# 1. After redirect to /lengkapi-profile
# 2. Fill all required fields
# 3. Submit
# 4. Check database that user is created/updated
# 5. Verify redirect to dashboard
```

---

## Database Checks

### Check User Data
```sql
-- Check if user exists with complete data
SELECT
  id, email, full_name,
  tanggal_lahir, tempat_lahir,
  pekerjaan, alasan_daftar,
  jenis_kelamin, negara
FROM users
WHERE email = 'test@example.com';

-- Check if all required fields are NOT NULL
SELECT
  column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'tanggal_lahir', 'tempat_lahir',
    'pekerjaan', 'alasan_daftar',
    'jenis_kelamin', 'negara'
  );
```

### Check Registration Data
```sql
-- Check pendaftaran submission
SELECT
  id, user_id, batch_id,
  status, submission_date,
  created_at
FROM pendaftaran_tikrar_tahfidz
ORDER BY created_at DESC
LIMIT 5;
```

---

## Expected Results

### ✅ Success Criteria
1. User dengan profil tidak lengkap → Tidak bisa submit, redirect ke lengkapi-profile
2. Lengkapi profile form → Berfungsi dengan baik, validasi benar
3. Setelah lengkapi profil → User bisa submit pendaftaran tanpa error
4. Error messages → Jelas dan informatif
5. Auto-redirect → Berfungsi dengan smooth (2 detik)
6. Data persistence → Semua data tersimpan dengan benar

### ❌ Failure Indicators
1. User bisa submit tanpa lengkapi profil
2. Redirect tidak terjadi
3. Data tidak tersimpan
4. Error message tidak jelas
5. Validasi tidak bekerja
6. Form tidak pre-fill data existing

---

## Notes
- Server running on port 3002 (3000 and 3001 in use)
- All files created and updated successfully
- No TypeScript compilation errors expected in runtime
- Database constraints enforce data integrity
