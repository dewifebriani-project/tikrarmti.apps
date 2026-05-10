# Dokumen Arsitektur (Final Revisi V5) – Tikrarmti Apps

Dokumen ini adalah acuan teknis utama ("Single Source of Truth") untuk pengembangan Tikrarmti Apps.
**Diperbarui berdasarkan Security Audit 29 Maret 2026.**

## Daftar Isi
1. [Prinsip Arsitektur](#prinsip-arsitektur)
2. [Teknologi & Stack](#teknologi--stack)
3. [Struktur Proyek](#struktur-proyek)
4. [Arsitektur Autentikasi](#arsitektur-autentikasi)
5. [Role-Based Access Control (Hierarchical RBAC)](#role-based-access-control-hierarchical-rbac)
6. [API Standard & Keamanan](#api-standard--keamanan)
7. [Keamanan Infrastruktur](#keamanan-infrastruktur)
8. [Admin Preview Mode](#admin-preview-mode)
9. [Aturan yang Tidak Boleh Dilanggar](#aturan-yang-tidak-boleh-dilanggar)

---

## 1. Prinsip Arsitektur
- **Server-Side Authority**: Validasi sesi dan hak akses hanya dilakukan di server — tidak pernah di client.
- **RLS as Final Guard**: Keamanan data mutlak berada di level database (Row Level Security).
- **Fail Fast**: Jika konfigurasi kritis (env vars, Supabase keys) tidak tersedia, server harus crash saat startup — bukan saat request.
- **Whitelist, not Blacklist**: Validasi input selalu menggunakan daftar nilai yang diizinkan (enum/whitelist), bukan blacklist atau sanity check parsial.

---

## 2. Teknologi & Stack
- **Next.js 14**: App Router, Server Actions.
- **Supabase SSR**: (`@supabase/ssr`) untuk manajemen Auth & Cookie.
- **Tailwind CSS**: Desain UI modern dan responsif.
- **Lucide React**: Konsistensi ikonografi.
- **Zod**: Validasi input di semua API endpoints.
- **Upstash Redis**: Rate limiting (wajib di production).

---

## 3. Struktur Proyek
```text
tikrarmti.apps/
├── app/
│   ├── (protected)/        # Halaman butuh login & Role Synthesis
│   │   ├── layout.tsx      # SECURITY GATE & ROLE SYNTHESIS
│   │   ├── admin/          # Khusus Rank Admin
│   │   └── ...
│   ├── api/                # Route Handlers
│   └── auth/               # Auth callback & logic
├── lib/
│   ├── roles.ts            # SOURCE OF TRUTH: Role Ranks & Logic
│   ├── rbac.ts             # SOURCE OF TRUTH: Auth middleware untuk API routes
│   ├── schemas/index.ts    # SOURCE OF TRUTH: Zod validation schemas
│   ├── supabase/           # Server/Middleware clients
│   └── rate-limiter.ts     # Rate limiting (Upstash Redis)
└── components/             # Shared UI components
```

---

## 4. Arsitektur Autentikasi

### The Security Gate (`app/(protected)/layout.tsx`)
Setiap request ke halaman terproteksi diverifikasi di layout utama. Selain verifikasi sesi, sistem melakukan **Role Synthesis**:
1. Mengambil data user dari database (`users` table).
2. Mengidentifikasi `primaryRole` berdasarkan peringkat tertinggi di array `roles`.
3. Mengirimkan `primaryRole` ke komponen client melalui props.

### Auth Middleware untuk API Routes
Semua API Route yang membutuhkan autentikasi harus menggunakan fungsi dari **`lib/rbac.ts`** — bukan `lib/auth-middleware.ts` (deprecated).

```typescript
// ✅ BENAR — gunakan lib/rbac.ts
import { requireAdmin, requireRole, getAuthorizationContext } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult) return authResult   // Returns NextResponse jika gagal

  // ... logika endpoint
}
```

```typescript
// ❌ SALAH — jangan gunakan (deprecated)
import { requireAdmin } from '@/lib/auth-middleware'
const authResult = await requireAdmin(request)
if (authResult instanceof NextResponse) { ... }
```

---

## 5. Role-Based Access Control (Hierarchical RBAC)

### Peringkat Role (ROLE_RANKS) — definisi canonical di `lib/roles.ts`
| Role | Rank | Akses |
|------|------|-------|
| `admin` | 100 | Penuh — semua fitur + Preview Mode |
| `musyrifah` | 80 | Panel musyrifah, monitoring jurnal, SP |
| `muallimah` | 60 | Panel pengajar, tashih, nilai |
| `thalibah` | 40 | Santri aktif — jurnal, tashih, profil |
| `calon_thalibah` | 20 | Pendaftar baru — pendaftaran & seleksi |

### Sistem Role Array
User dapat memiliki **lebih dari satu role** (misal: admin sekaligus muallimah). Role disimpan di kolom `roles text[]` di tabel `users`.

```typescript
// ✅ BENAR — cek dengan roles array
const isAdmin = userData.roles?.includes('admin') ?? false
const isMusyrifah = userData.roles?.includes('musyrifah') ?? false
```

```typescript
// ❌ SALAH — gunakan single role field (deprecated, akan dihapus)
const isAdmin = userData.role === 'admin'
```

### Penggunaan di Client Component
```typescript
import { hasRequiredRank, ROLE_RANKS } from '@/lib/roles'

if (hasRequiredRank(user.primaryRole, ROLE_RANKS.admin)) {
  // Tampilkan fitur admin
}
```

---

## 6. API Standard & Keamanan

### 6.1 Format Response
```typescript
// Success
{ success: true, data: [...], message?: string }

// Error — TIDAK PERNAH menyertakan detail teknis database
{ success: false, error: { code: string, message: string } }
```

**Dilarang keras** mengirim `error.message`, `error.hint`, `error.code` Supabase ke client:
```typescript
// ❌ SALAH — membocorkan informasi database
return NextResponse.json({ error: 'Failed', details: error.message, hint: error.hint })

// ✅ BENAR — gunakan ApiResponses dari lib/api-responses.ts
return ApiResponses.databaseError(error)
// atau
return NextResponse.json({ error: 'Operasi gagal' }, { status: 500 })
```

### 6.2 Validasi Input

Semua input dari query params maupun request body harus divalidasi dengan Zod atau whitelist eksplisit:

```typescript
// ✅ Status parameter — wajib whitelist
const VALID_STATUSES = ['draft', 'open', 'closed', 'archived'] as const
const status = rawStatus && VALID_STATUSES.includes(rawStatus as any) ? rawStatus : null

// ✅ UUID parameter — wajib validasi sebelum query DB
const uuidValidation = commonSchemas.uuid.safeParse(id)
if (!uuidValidation.success) return ApiResponses.error('VALIDATION_ERROR', 'Invalid ID', {}, 400)

// ✅ Pagination — clamp nilai min/max
const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50'), 1), 100)
```

### 6.3 Role di Registrasi
Role user **wajib di-hardcode** di server, tidak pernah diambil dari request body:
```typescript
// ✅ BENAR — hardcode di server
const role = 'thalibah'  // Public registration selalu calon_thalibah atau thalibah

// ❌ SALAH — attacker bisa kirim role: 'admin'
const { role = 'thalibah' } = body
```

---

## 7. Keamanan Infrastruktur

### 7.1 CORS
CORS dikonfigurasi per environment di `next.config.js`:
- **Production**: hanya `https://markaztikrar.id`
- **Development**: hanya `http://localhost:3000`

Tidak pernah menggunakan wildcard (`*`) bersamaan dengan `Access-Control-Allow-Credentials: true`.

### 7.2 CSRF Protection
Semua request POST/PUT/PATCH/DELETE ke `/api/` divalidasi `Origin` header-nya di `lib/supabase/middleware.ts`. Request dari origin yang tidak dikenal ditolak dengan status 403.

### 7.3 Content Security Policy
CSP dikonfigurasi di `next.config.js`. `unsafe-eval` **tidak diizinkan** di `script-src`. Jika Next.js membutuhkan inline scripts, gunakan pendekatan nonce-based.

### 7.4 Rate Limiting
Rate limiting wajib aktif di production menggunakan Upstash Redis. Jika `UPSTASH_REDIS_REST_URL` tidak dikonfigurasi di production, server akan menampilkan error di startup log.

| Limiter | Batas | Digunakan di |
|---------|-------|--------------|
| `authRateLimit` | 5 req/menit per IP | `/api/auth/register`, `/api/auth/login` |
| `generalApiRateLimit` | 100 req/menit | API umum |
| `adminRateLimit` | 200 req/menit per user ID | Semua `/api/admin/*` endpoints |

### 7.5 Supabase Client
- **`createServerClient()`** — gunakan untuk operasi yang harus menghormati RLS (baca data user biasa).
- **`createSupabaseAdmin()`** — gunakan hanya ketika RLS perlu di-bypass (operasi admin, role lookup). Akan `throw Error` jika env vars tidak tersedia.

```typescript
// ✅ Untuk role lookup dan operasi admin
const adminClient = createSupabaseAdmin()

// ✅ Untuk query yang harus menghormati RLS
const supabase = createServerClient()
```

---

## 8. Admin Preview Mode
Admin dapat melihat halaman santri (Tashih, Jurnal, dll) tanpa memiliki pendaftaran aktif.

### Implementasi:
1. **Frontend**: Jika data pendaftaran tidak ditemukan tetapi user adalah Admin, UI menampilkan banner "Mode Preview" (kuning) dan menggunakan data sampel/default.
2. **API**: Route seperti `/api/dashboard/tashih-status` mendeteksi status Admin dan mengembalikan data simulasi (misal: Juz 30) alih-alih error 404.

---

## 9. Aturan yang Tidak Boleh Dilanggar

| # | Aturan | Alasan |
|---|--------|--------|
| 1 | Gunakan `lib/rbac.ts` untuk auth check di API, bukan `lib/auth-middleware.ts` | `auth-middleware.ts` deprecated, checks `role` lama |
| 2 | Cek role dengan `roles?.includes('admin')`, bukan `role === 'admin'` | Kolom `role` tunggal akan dihapus; sistem pakai `roles[]` |
| 3 | Jangan return `error.message`/`error.hint`/`error.code` Supabase ke client | Membocorkan skema database & celah SQL injection |
| 4 | Selalu whitelist nilai `status` query param sebelum dipakai ke query DB | Mencegah injeksi nilai invalid |
| 5 | Hardcode `role: 'thalibah'` di registrasi publik | Mencegah privilege escalation |
| 6 | Jangan tambahkan placeholder/fallback di Supabase client | Silent failure lebih berbahaya dari crash |
| 7 | Jangan gunakan wildcard CORS di production | Membatalkan perlindungan CSRF |
| 8 | Validasi UUID sebelum query database | Mencegah 500 error dan kebocoran info |

---

*Terakhir diperbarui: 29 Maret 2026 — Post Security Audit*
