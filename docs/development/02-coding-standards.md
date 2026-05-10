# 02 — Coding Standards

Aturan gaya kode untuk semua kontribusi. Konsistensi di sini = lebih sedikit bug + review lebih cepat.

## TypeScript

### Aturan Ketat

1. **Hindari `any`.** Gunakan `unknown` lalu narrow, atau buat tipe eksplisit.
2. **Tidak ada `// @ts-ignore`** — kalau benar-benar perlu, gunakan `// @ts-expect-error <alasan>` plus komentar.
3. **`strict: true`** sudah aktif di [`tsconfig.json`](../../tsconfig.json). Jangan dilemahkan.
4. **Import via path alias `@/`** — bukan `../../../lib/...`.
5. **Generated types adalah read-only.** Jangan edit [`types/supabase.ts`](../../types/supabase.ts) tangan; jalankan `npm run gen-types`.

### Pola yang Dihindari

```typescript
// ❌ Membungkus sembarang error tanpa narrowing
catch (e: any) { console.log(e.message) }

// ✅ Narrow dulu
catch (e) {
  const msg = e instanceof Error ? e.message : 'Unknown error'
  logger.error('failed', { msg })
}
```

```typescript
// ❌ Type assertion untuk "memaksa" build hijau
const user = data as User

// ✅ Validasi runtime via Zod, lalu type-nya inferred
const result = userSchemas.base.safeParse(data)
if (!result.success) return ApiResponses.validationError(result.error)
const user = result.data
```

## Penamaan

| Item | Konvensi | Contoh |
|------|----------|--------|
| File komponen React | PascalCase | `DashboardSidebar.tsx` |
| File hook | camelCase, prefix `use` | `useAdminPaginated.ts` |
| File util / lib | kebab-case atau camelCase (ikuti tetangganya) | `format-utils.ts`, `batchService.ts` |
| Halaman App Router | lowercase, kebab-case | `app/(protected)/jurnal-harian/page.tsx` |
| Route handler | `route.ts` (Next.js convention) | `app/api/admin/users/route.ts` |
| Variable & function | camelCase | `getUserRoles`, `isAdmin` |
| Constant top-level | UPPER_SNAKE_CASE | `ROLE_RANKS`, `MAX_PAGE_SIZE` |
| Type & interface | PascalCase | `User`, `JurnalHarianRow` |
| Zod schema | camelCase + `Schemas` namespace | `userSchemas.registration` |
| Boolean variable | `is`/`has`/`can` prefix | `isAdmin`, `hasActiveBatch` |

> **Bahasa:** identifier kode = **Inggris**. String UI, copy, error message ke user = **Bahasa Indonesia**. Komentar boleh keduanya — pilih yang paling jelas.

## Struktur Folder

Aturan tempat menaruh kode baru:

```
app/
├── (protected)/<feature>/      # Halaman yang butuh login
│   ├── page.tsx                # UI utama (Server Component bila bisa)
│   ├── actions.ts              # Server Actions khusus halaman ini
│   └── components/             # Komponen LOKAL (tidak dipakai halaman lain)
├── api/<resource>/route.ts     # Route handler (REST-style)
└── <public-page>/page.tsx      # Halaman publik

components/                     # Komponen GLOBAL (dipakai >1 halaman)
├── ui/                         # shadcn primitives — jangan diedit kecuali upgrade
└── <feature>/                  # Komponen feature-specific yang reusable

lib/
├── schemas/                    # Zod schemas (SOURCE OF TRUTH validasi)
├── supabase/                   # Supabase client (server, browser, middleware)
├── hooks/                      # Custom hooks reusable
├── queries/                    # SWR fetchers / query helpers
├── utils/                      # Utility murni (pure function)
├── rbac.ts                     # SOURCE OF TRUTH auth API
├── roles.ts                    # SOURCE OF TRUTH role ranks
└── env.ts                      # SOURCE OF TRUTH env validation

types/                          # Tipe global & generated
hooks/                          # Custom hooks legacy (perlahan dipindah ke lib/hooks)
```

### Aturan Penempatan

- Komponen dipakai 1 halaman → `app/(protected)/<feature>/components/`.
- Komponen dipakai ≥2 halaman → `components/<feature>/`.
- Logic non-React (validation, formatter, query) → `lib/`, **bukan** di file komponen.
- Server Action spesifik halaman → `app/(protected)/<feature>/actions.ts`.

## React & Next.js

### Server Component vs Client Component

**Default: Server Component.** Jangan tambahkan `'use client'` kecuali butuh:

- React state / effect (`useState`, `useEffect`).
- Browser-only API (`window`, `localStorage`).
- Event handler (`onClick`, `onChange`).
- Library yang mensyaratkan client (React Hook Form bagian interaktif, Chart.js).

```tsx
// ✅ Server Component — fetch langsung, tidak butuh useEffect
export default async function Page() {
  const supabase = createServerClient()
  const { data } = await supabase.from('batches').select('*')
  return <BatchList batches={data ?? []} />
}
```

```tsx
// 'use client' — hanya bagian interaktif yang butuh
'use client'
export function BatchActionsMenu({ batchId }: Props) {
  const [open, setOpen] = useState(false)
  // ...
}
```

### Pola Data Fetching

| Konteks | Tool | Catatan |
|---------|------|---------|
| Server Component | `createServerClient()` langsung | Hormati RLS |
| Client interaktif (list, refresh) | SWR (lihat `lib/swr/`) | Cache + revalidate |
| Mutasi user-triggered | Server Action atau `fetch('/api/...')` | Bukan langsung dari browser ke Supabase untuk operasi sensitif |
| Operasi admin bypass RLS | API route + `createSupabaseAdmin()` | **Tidak pernah** di client |

### Pola Form

1. Gunakan **Zod schema** dari `lib/schemas/` — share antara client (validasi awal) dan server (validasi otoritatif).
2. Validasi di client = UX. Validasi di server = security. Wajib **dua-duanya**.
3. Pesan error ke user dalam Bahasa Indonesia.
4. Disable submit button selama in-flight request, jangan hanya andalkan double-click guard di server.

### Hooks

- Custom hook reusable → `lib/hooks/`.
- Aturan dependensi `useEffect` mengikat: tidak ada `// eslint-disable-next-line react-hooks/exhaustive-deps`.
- `useEffect` untuk side effect saja. Untuk derived state, hitung langsung di render.

## Styling

### Tailwind

- Pakai utility class langsung — **jangan** buat CSS kustom kecuali untuk animasi/keyframe global.
- Variabel warna brand (`mti-green`, `mti-gold`) sudah ada di [`tailwind.config.js`](../../tailwind.config.js) — pakai itu.
- Class panjang? Pisah pakai `cn()` helper dari `lib/utils.ts`:

```tsx
<div className={cn(
  'flex flex-col gap-4 p-6',
  'rounded-lg border border-border bg-card',
  isActive && 'ring-2 ring-mti-green'
)} />
```

### shadcn/ui

- Komponen ada di `components/ui/`. **Jangan diedit langsung** — kalau perlu perilaku berbeda, wrap atau extend.
- Tambah komponen baru via `npx shadcn@latest add <name>` (cek arahan tim dulu).
- Lihat [05-component-guide.md](05-component-guide.md) untuk pola pemakaian.

### Responsive

Default mobile-first. Breakpoint Tailwind: `sm` (640), `md` (768), `lg` (1024), `xl` (1280).

```tsx
// Mobile dulu, lalu naikkan
<div className="flex flex-col gap-2 md:flex-row md:gap-4" />
```

## Logging & Error Handling

- Gunakan `lib/logger.ts` (server) atau `lib/logger-secure.ts` (filter PII) — **bukan** `console.log` mentah di kode produksi.
- Error API: kembalikan via `lib/api-responses.ts` — jangan return `error.message` Supabase ke client.
- Sentry sudah aktif (`@sentry/nextjs`) — error yang sengaja di-throw akan ditangkap.

```typescript
// ❌
console.log('user data:', user)

// ✅
logger.info('user_loaded', { userId: user.id })  // ID saja, bukan PII penuh
```

## Komentar

**Default: jangan tulis komentar.** Nama variable yang baik > komentar.

Tulis komentar **hanya** untuk:

- Alasan **kenapa** — bukan **apa**.
- Workaround bug spesifik (sertakan referensi issue/PR).
- Constraint tersembunyi yang akan mengejutkan pembaca berikutnya.
- Catatan keamanan kritis (`// SECURITY: …`).

```typescript
// ❌ Komentar mengulang kode
// Get user from database
const user = await getUser(id)

// ✅ Komentar menjelaskan KENAPA
// Pakai admin client karena RLS akan menolak query lintas-tenant ini
const adminClient = createSupabaseAdmin()
```

## Forbid List

Pola yang **tidak boleh ditambahkan ke kode baru**:

| Pola | Pengganti |
|------|-----------|
| `from '@/lib/auth-middleware'` | `from '@/lib/rbac'` |
| `userData.role === 'admin'` | `userData.roles?.includes('admin')` |
| `error.message` di response API | `ApiResponses.databaseError(error)` |
| `any` | tipe eksplisit / `unknown` + narrow |
| `console.log` di kode produksi | `logger.info/warn/error` |
| `'use client'` di seluruh halaman | Bagi: server wrapper + island client |
| Hardcode warna hex di JSX | Token Tailwind (`bg-mti-green`) |

---

Lanjut ke → [03-git-workflow.md](03-git-workflow.md)
