# 04 — API Development

Pola wajib untuk semua route di `app/api/`. Acuan utama keamanan: [architecture/arsitektur.md](architecture/arsitektur.md).

## Anatomi Route Handler

Setiap route handler mengikuti struktur ini, **dalam urutan ini**:

```typescript
// app/api/<resource>/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/rbac'
import { createServerClient } from '@/lib/supabase'
import { ApiResponses } from '@/lib/api-responses'
import { adminRateLimit } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

// 1. Schema validation — di luar handler, satu instance per modul
const requestSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
})

export async function POST(request: NextRequest) {
  try {
    // 2. Rate limiting (paling awal — cegah DoS)
    const rl = await adminRateLimit.check(request)
    if (!rl.success) return ApiResponses.rateLimited()

    // 3. Auth check
    const authError = await requireAdmin()
    if (authError) return authError

    // 4. Input validation
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) return ApiResponses.validationError(parsed.error)

    // 5. Business logic
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('users')
      .insert({ email: parsed.data.email, full_name: parsed.data.fullName })
      .select()
      .single()

    if (error) {
      logger.error('user_create_failed', { code: error.code })
      return ApiResponses.databaseError(error)
    }

    // 6. Return — format konsisten
    return ApiResponses.success(data)
  } catch (e) {
    logger.error('user_create_unexpected', { e })
    return ApiResponses.internalError()
  }
}
```

> **Kenapa urutan ini wajib:** rate limit duluan supaya attacker tidak bisa mengukur waktu auth. Auth sebelum validation supaya pesan error tidak membocorkan bahwa endpoint ada.

## Auth & RBAC

Pakai **`lib/rbac.ts`** — bukan `lib/auth-middleware.ts` (deprecated).

```typescript
import {
  requireAdmin,            // hanya admin
  requireRole,             // role spesifik
  requireMinRank,          // rank ≥ N
  getAuthorizationContext, // dapatkan user + role tanpa enforce
} from '@/lib/rbac'
```

### Pola Standar

```typescript
// Admin only
const err = await requireAdmin()
if (err) return err

// Role spesifik (boleh array)
const err = await requireRole(['musyrifah', 'admin'])
if (err) return err

// Minimum rank (lihat ROLE_RANKS di lib/roles.ts)
const err = await requireMinRank(60)  // muallimah ke atas
if (err) return err

// Hanya butuh user info, tidak enforce role
const ctx = await getAuthorizationContext()
if (!ctx) return ApiResponses.unauthorized()
const userId = ctx.user.id
```

### Anti-Pattern

```typescript
// ❌ Cek role pakai kolom legacy `role`
if (userData.role === 'admin') { ... }

// ✅ Selalu pakai array `roles`
if (userData.roles?.includes('admin')) { ... }
```

## Validasi Input

**Tiga lapisan**, dari paling lemah ke paling kuat:

1. **Whitelist enum** — untuk parameter status, sort, dll.
2. **Zod schema** — untuk body & query kompleks.
3. **RLS** — final guard di database.

### Query Parameters

```typescript
const { searchParams } = new URL(request.url)

// ✅ Whitelist
const VALID_STATUSES = ['draft', 'open', 'closed'] as const
const status = searchParams.get('status')
const safeStatus = VALID_STATUSES.includes(status as any) ? status : null

// ✅ UUID — validasi sebelum query
const idResult = commonSchemas.uuid.safeParse(searchParams.get('id'))
if (!idResult.success) return ApiResponses.error('VALIDATION_ERROR', 'Invalid ID', {}, 400)

// ✅ Pagination — clamp
const page = Math.max(parseInt(searchParams.get('page') ?? '1'), 1)
const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50'), 1), 100)
```

### Body

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['thalibah']),    // whitelist enum
  age: z.number().int().min(1).max(150),
})

const parsed = schema.safeParse(await request.json())
if (!parsed.success) return ApiResponses.validationError(parsed.error)

// parsed.data sekarang fully typed
```

> Schema reusable simpan di [`lib/schemas/`](../../lib/schemas/). Jangan duplikasi.

## Format Response

**Selalu pakai helper** dari [`lib/api-responses.ts`](../../lib/api-responses.ts):

```typescript
ApiResponses.success(data, message?)        // 200
ApiResponses.created(data)                   // 201
ApiResponses.noContent()                     // 204
ApiResponses.validationError(zodError)       // 400
ApiResponses.unauthorized()                  // 401
ApiResponses.forbidden()                     // 403
ApiResponses.notFound()                      // 404
ApiResponses.rateLimited()                   // 429
ApiResponses.databaseError(error)            // 500 — sanitized
ApiResponses.internalError()                 // 500
```

### Aturan Mati

```typescript
// ❌ Jangan pernah expose detail Supabase ke client
return NextResponse.json({
  error: 'failed',
  details: error.message,        // bocor skema
  hint: error.hint,              // bocor query plan
  code: error.code,              // bocor PostgreSQL state
})

// ✅ Helper sudah strip detail sensitif
return ApiResponses.databaseError(error)   // log internal, return generic
```

## Pemilihan Supabase Client

| Skenario | Client | Alasan |
|----------|--------|--------|
| Baca data user yang login | `createServerClient()` | Hormati RLS — ini benteng utama |
| Tulis data user yang login | `createServerClient()` | Idem |
| Operasi admin (lookup role, list semua user) | `createSupabaseAdmin()` | Bypass RLS — hanya untuk admin route |
| Browser / Client Component | `createBrowserClient()` | Hormati session cookie |
| Middleware | `lib/supabase/middleware.ts` | Khusus middleware Next.js |

```typescript
// ✅ Operasi admin — pakai service role
const adminClient = createSupabaseAdmin()
const { data: allUsers } = await adminClient.from('users').select('*')

// ✅ Operasi user biasa — pakai server client
const supabase = createServerClient()
const { data: myProfile } = await supabase.from('users').select('*').single()
```

> `createSupabaseAdmin()` akan **throw** jika `SUPABASE_SERVICE_ROLE_KEY` tidak ada. Ini disengaja — Fail Fast.

## Rate Limiting

**Wajib** untuk semua endpoint mutasi & endpoint sensitif.

```typescript
import { authRateLimit, generalApiRateLimit, adminRateLimit } from '@/lib/rate-limiter'

// Pilih yang sesuai:
// - authRateLimit:    /api/auth/*  (5/menit per IP)
// - generalApiRateLimit: API umum  (100/menit)
// - adminRateLimit:   /api/admin/* (200/menit per user ID)

const rl = await adminRateLimit.check(request)
if (!rl.success) return ApiResponses.rateLimited()
```

Di production, `UPSTASH_REDIS_REST_URL` & token wajib ter-set; tanpa itu rate limit fallback ke no-op dan akan menampilkan warning di startup log.

## Error Handling

```typescript
try {
  // logika utama
} catch (e) {
  // Log internal — sertakan konteks (IDs, request ID)
  logger.error('handler_unexpected', {
    handler: 'POST /api/admin/users',
    userId: ctx?.user.id,
    err: e instanceof Error ? e.message : String(e),
  })
  return ApiResponses.internalError()
}
```

> Sentry (`@sentry/nextjs`) sudah ter-wire — error yang escape akan ter-capture otomatis. Tetap log dengan konteks supaya bisa di-correlate.

## CORS & CSRF

- CORS dikonfigurasi per environment di [`next.config.js`](../../next.config.js). Jangan tambahkan header CORS manual di handler.
- CSRF: middleware (`lib/supabase/middleware.ts`) memvalidasi `Origin` untuk semua POST/PUT/PATCH/DELETE. Jangan disable.

## Dokumentasi Endpoint

Untuk endpoint baru yang non-trivial, tulis JSDoc minimal di atas handler:

```typescript
/**
 * POST /api/admin/users/merge
 * Merge dua user (winner ⟵ loser). Audit log otomatis.
 *
 * Body: { winnerId: string (uuid), loserId: string (uuid), mode: 'soft' | 'hard' }
 * Auth: admin only
 * Rate: adminRateLimit
 */
export async function POST(request: NextRequest) { ... }
```

## Checklist Endpoint Baru

- [ ] Rate limit dipasang.
- [ ] Auth check (`requireAdmin` / `requireRole` / dst.).
- [ ] Input divalidasi (Zod / whitelist).
- [ ] Pakai `ApiResponses.*` — bukan `NextResponse.json` mentah untuk error.
- [ ] Tidak ada `error.message`/`hint`/`code` Supabase di response.
- [ ] Pemilihan client tepat (`createServerClient` vs `createSupabaseAdmin`).
- [ ] Logging dengan konteks, bukan PII.
- [ ] Operasi mutasi sukses → response konsisten (`success: true, data`).
- [ ] Migrasi DB / RLS update terkait endpoint ini sudah dibuat.

---

Lanjut ke → [05-component-guide.md](05-component-guide.md)
