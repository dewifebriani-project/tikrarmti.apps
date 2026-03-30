# Security Guidelines – Tikrarmti Apps

Dokumen ini adalah panduan keamanan wajib untuk semua kontributor.
Dihasilkan dari Security Audit 29 Maret 2026.

---

## Checklist Sebelum Membuat API Route Baru

```
[ ] Auth check menggunakan requireAdmin()/requireRole() dari lib/rbac.ts
[ ] Input divalidasi dengan Zod schema atau whitelist eksplisit
[ ] Status/enum parameter menggunakan whitelist array
[ ] UUID parameter divalidasi sebelum query DB
[ ] Error response tidak mengandung error.message/hint/code dari Supabase
[ ] Pagination menggunakan Math.max/Math.min untuk clamp nilai
[ ] Rate limiting diterapkan (terutama untuk endpoint admin/auth)
```

---

## 1. Auth Check — Gunakan `lib/rbac.ts`

```typescript
import { requireAdmin, requireRole, requireAnyRole } from '@/lib/rbac'

// Hanya admin
const authResult = await requireAdmin()
if (authResult) return authResult

// Role tertentu
const authResult = await requireRole('musyrifah')
if (authResult) return authResult

// Salah satu dari beberapa role
const authResult = await requireAnyRole(['admin', 'musyrifah'])
if (authResult) return authResult
```

**Jangan gunakan** `lib/auth-middleware.ts` (deprecated) atau cek manual `userData.role === 'admin'`.

---

## 2. Role Check — Gunakan `roles` Array

```typescript
// ✅ Benar
const isAdmin = userData.roles?.includes('admin') ?? false
const isStaff = userData.roles?.some(r => ['admin', 'musyrifah', 'muallimah'].includes(r)) ?? false

// ❌ Salah (deprecated)
const isAdmin = userData.role === 'admin'
const isAdmin = userData.role !== 'admin'
```

---

## 3. Error Response — Jangan Bocorkan Detail DB

```typescript
// ✅ Benar — pesan generik ke client, detail ke server log
if (error) {
  console.error('[MyRoute] DB error:', error.code)  // log hanya code
  return ApiResponses.databaseError(error)           // atau:
  return NextResponse.json({ error: 'Operasi gagal' }, { status: 500 })
}

// ❌ Salah — membocorkan SQL hints dan error code
return NextResponse.json({
  error: 'Failed',
  details: error.message,  // ❌
  hint: error.hint,        // ❌
  code: error.code         // ❌
})
```

---

## 4. Validasi Input

### Status/Enum Parameter
```typescript
const VALID_STATUSES = ['draft', 'open', 'closed', 'archived'] as const
type ValidStatus = typeof VALID_STATUSES[number]

const rawStatus = searchParams.get('status')
const status = rawStatus && VALID_STATUSES.includes(rawStatus as ValidStatus)
  ? rawStatus as ValidStatus
  : null
```

### UUID Parameter
```typescript
import { commonSchemas } from '@/lib/schemas'

const id = params.id
const validation = commonSchemas.uuid.safeParse(id)
if (!validation.success) {
  return ApiResponses.error('VALIDATION_ERROR', 'Invalid ID format', {}, 400)
}
```

### Pagination
```typescript
const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100)
const offset = (page - 1) * limit
```

---

## 5. Role di Registrasi/Insert User

Role **tidak boleh** diambil dari request body untuk endpoint publik:

```typescript
// ✅ Benar — server menentukan role
const role = 'thalibah'  // hardcode

// ❌ Salah — attacker bisa kirim role: 'admin'
const { role = 'thalibah' } = body
```

---

## 6. Supabase Client

| Client | Kapan digunakan |
|--------|----------------|
| `createServerClient()` | Operasi baca/tulis yang harus menghormati RLS |
| `createSupabaseAdmin()` | Role lookup, operasi admin yang perlu bypass RLS |

`createSupabaseAdmin()` akan **throw Error** jika env vars tidak tersedia — jangan tambahkan fallback/placeholder.

---

## 7. CORS & CSRF

- CORS hanya boleh allow origin spesifik per environment (lihat `next.config.js`)
- Jangan pernah kombinasikan `Access-Control-Allow-Origin: *` dengan `Access-Control-Allow-Credentials: true`
- CSRF protection sudah aktif via validasi `Origin` header di middleware untuk semua POST/PUT/PATCH/DELETE ke `/api/`
- Jika ada client eksternal (mobile app, third-party) yang perlu akses API, tambahkan originnya ke `ALLOWED_ORIGINS` di `lib/supabase/middleware.ts`

---

## 8. Rate Limiting

```typescript
import { adminRateLimit, authRateLimit, generalApiRateLimit, getClientIP } from '@/lib/rate-limiter'

// Di admin endpoints
if (adminRateLimit) {
  const { success } = await adminRateLimit.limit(`admin:${endpoint}:${user.id}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}

// Di auth endpoints
if (authRateLimit) {
  const { success } = await authRateLimit.limit(getClientIP(request))
  if (!success) return ApiResponses.rateLimit('...')
}
```

---

## 9. TypeScript

`tsconfig.json` mengaktifkan `strictNullChecks` dan `noImplicitAny`. Semua kode baru harus:
- Tidak menggunakan tipe `any` implisit
- Tidak mengasumsikan nilai non-null tanpa pengecekan
- Gunakan nullish coalescing (`??`) dan optional chaining (`?.`)

---

## Isu yang Masih Perlu Ditangani (Backlog)

| Isu | File | Prioritas |
|-----|------|-----------|
| 77 file masih inisialisasi `createSupabaseAdmin()` di module level | berbagai `app/api/**/route.ts` | LOW — Next.js handles ini dengan baik, tapi lebih baik di-lazy |
| 20+ endpoint masih mengembalikan `details: error.message` | berbagai `app/api/**/route.ts` | MEDIUM — fix secara bertahap saat menyentuh file tersebut |
| TypeScript `strict: true` penuh belum diaktifkan | `tsconfig.json` | MEDIUM — aktifkan bertahap, fix type errors satu per satu |
| Audit log tidak konsisten di semua operasi sensitif | berbagai `app/api/**/route.ts` | LOW |

> **Konvensi**: Saat menyentuh file yang masih memiliki isu di atas, perbaiki sekalian sebagai bagian dari PR tersebut.
