# 05 — Component Guide

Pola membangun komponen UI yang konsisten dengan codebase.

## Pohon Keputusan: Mau Bikin Komponen Apa?

```
Sudah ada di components/ui/ (shadcn)?
├─ Ya → pakai langsung
└─ Tidak
    │
    ├─ Cuma butuh komposisi sederhana?
    │   └─ Pakai utility class Tailwind di tempat — tidak usah bikin komponen
    │
    ├─ Dipakai di 1 halaman?
    │   └─ Taruh di app/(protected)/<feature>/components/
    │
    └─ Dipakai ≥2 halaman atau kompleks?
        └─ Taruh di components/<feature>/
```

> Aturan tiga: tiga baris JSX serupa **bukan** alasan ekstrak komponen. Tunggu pola benar-benar berulang & stabil baru abstraksi.

## Hirarki Komponen Proyek

| Lokasi | Contoh | Aturan |
|--------|--------|--------|
| `components/ui/` | `Button`, `Dialog`, `Select` | shadcn primitives — **jangan diedit** |
| `components/<feature>/` | `admin/users/UserTable.tsx`, `promo/Hero.tsx` | Komposisi feature, reusable lintas halaman |
| `components/<global>.tsx` | `DashboardSidebar`, `Footer`, `ErrorBoundary` | Layout/chrome global |
| `app/<route>/components/` | (contoh: `app/(protected)/admin/batch-program/`) | Hanya untuk route itu |

## Server vs Client Component

### Default: Server Component

Tidak butuh `'use client'`? Jangan pakai. Server Component lebih kecil bundle, bisa fetch data langsung, dan tidak hydration cost.

```tsx
// ✅ Server Component — fetch sekali di server
import { createServerClient } from '@/lib/supabase'

export default async function BatchListPage() {
  const supabase = createServerClient()
  const { data: batches } = await supabase
    .from('batches')
    .select('*')
    .order('start_date', { ascending: false })

  return <BatchList batches={batches ?? []} />
}
```

### Client Component — Saat Wajib

```tsx
'use client'
import { useState } from 'react'

export function BatchActionsMenu({ batchId }: { batchId: string }) {
  const [open, setOpen] = useState(false)
  // Event handler & state hanya di komponen ini
}
```

### Pola "Server Wrapper + Client Island"

Untuk halaman yang sebagian interaktif, sebagian static — bukan satu file `'use client'` di seluruh page.

```tsx
// page.tsx — Server Component
export default async function Page() {
  const data = await fetchData()
  return (
    <main>
      <StaticHeader user={data.user} />
      <InteractiveTable initialRows={data.rows} />  {/* island */}
    </main>
  )
}
```

```tsx
// InteractiveTable.tsx — 'use client'
'use client'
export function InteractiveTable({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows)
  // ...
}
```

## Pola Props

### Tipe Props Eksplisit

```tsx
// ✅ Interface terpisah, dieksport bila berguna
export interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  isLoading?: boolean
}

export function UserTable({ users, onEdit, isLoading = false }: UserTableProps) {
  // ...
}
```

### Hindari

```tsx
// ❌ Tipe inline & opaque
export function UserTable({ users, onEdit }: { users: any[]; onEdit: any }) { }

// ❌ Spread props ke DOM tanpa filter
<div {...props} />   // bisa expose handler tak terduga

// ❌ Boolean props yang ambigu
<Button primary secondary disabled />   // gunakan variant prop
```

### Children & Composition

Lebih sering pakai `children` daripada banyak prop string.

```tsx
// ✅
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// ❌ jangan
<Card title="..." description="..." footer={<Button />} />
```

## State Management

### Lokal dulu

`useState` di komponen pemilik state. **Jangan** angkat ke context kecuali state benar-benar global (auth, theme, toast queue).

### Server State (data dari API)

Pakai **SWR** untuk client-side fetch — sudah standar di proyek (lihat [`lib/swr/`](../../lib/swr/) & hook contoh di [`hooks/`](../../hooks/)).

```tsx
'use client'
import useSWR from 'swr'

export function MyJurnalList() {
  const { data, error, isLoading, mutate } = useSWR('/api/jurnal', fetcher)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState onRetry={() => mutate()} />
  return <JurnalTable rows={data} />
}
```

### Form State

- Form sederhana: `useState` per field cukup.
- Form kompleks (multi-step, conditional, validasi cross-field): pertimbangkan controlled state + Zod.
- **Selalu** disable submit button selama in-flight.

```tsx
const [submitting, setSubmitting] = useState(false)

async function onSubmit(e: FormEvent) {
  e.preventDefault()
  setSubmitting(true)
  try {
    await fetch('/api/...', { method: 'POST', body: JSON.stringify(values) })
    toast.success('Tersimpan')
  } catch {
    toast.error('Gagal menyimpan')
  } finally {
    setSubmitting(false)
  }
}

<Button type="submit" disabled={submitting}>
  {submitting ? 'Menyimpan...' : 'Simpan'}
</Button>
```

## Loading, Empty, Error States

Setiap komponen yang fetch data **wajib** menangani 4 state:

| State | Pola |
|-------|------|
| **Loading** | Skeleton (`components/ui/skeleton.tsx`) — bukan spinner generik untuk list |
| **Empty** | Pesan + ilustrasi/ikon + CTA bila relevan |
| **Error** | Pesan ramah Bahasa Indonesia + tombol retry |
| **Success** | Konten utama |

Jangan tinggalkan layar kosong saat loading — itu terasa rusak.

## Pola Tabel Data

Pakai komponen yang sudah ada (`AdminDataTable`, dst.) sebagai referensi. Pola wajib:

- Pagination server-side untuk dataset >100 baris.
- Skeleton row saat loading awal.
- Empty state khusus (bukan tabel kosong).
- Action menu pakai `DropdownMenu` dari shadcn.
- Konfirmasi destruktif pakai `AlertDialog` — **tidak** pakai `window.confirm`.

## Toast & Notifikasi

Proyek punya dua library — gunakan yang sudah dipasang di area itu, **jangan campur**:

- `sonner` — ditandai di [`app/layout.tsx`](../../app/layout.tsx).
- `react-hot-toast` — legacy di sebagian halaman.

> Migrasi bertahap ke `sonner` saat menyentuh halaman terkait. Jangan menambahkan library toast ketiga.

## Aksesibilitas (a11y)

Minimal yang harus dipenuhi:

- Setiap input punya `<label>` (atau `aria-label` untuk icon button).
- Button bukan `<div>` dengan `onClick`.
- Modal pakai `Dialog` shadcn (sudah handle focus trap & escape).
- Warna teks vs background ≥ AA (4.5:1).
- Form error pakai `aria-invalid` + pesan terhubung via `aria-describedby`.

## Responsive

Mobile-first. Test di lebar 375px (iPhone SE) sebelum merge.

```tsx
// Pola umum
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2
  lg:grid-cols-3
" />

// Sembunyikan/tampilkan per breakpoint
<aside className="hidden md:block" />
<button className="md:hidden">Menu</button>
```

## Performance

- **Image:** pakai `next/image` — bukan `<img>` mentah.
- **List besar (>200 item):** virtualisasi atau pagination, jangan render semua.
- **Heavy component:** import dinamis — `dynamic(() => import('./Heavy'), { ssr: false })`.
- **Memoisasi (`useMemo`, `React.memo`):** **jangan default**. Tambahkan setelah profiler menunjukkan masalah.

## Larangan

| Anti-pattern | Alternatif |
|--------------|-----------|
| Edit `components/ui/*` shadcn | Wrap atau buat varian baru |
| Inline style `style={{ color: '#4a5f3a' }}` | Token Tailwind `text-mti-green` |
| `window.alert` / `window.confirm` | `Dialog` / `AlertDialog` shadcn + toast |
| `<img>` raw | `next/image` |
| `'use client'` di seluruh halaman padahal sebagian static | Server wrapper + client island |
| Effect untuk derived state | Hitung langsung di render |
| `useEffect(() => { fetch... }, [])` di Client Component baru | SWR atau pindah ke Server Component |

---

Lanjut ke → [06-database-changes.md](06-database-changes.md)
