# Dokumen Arsitektur (Revisi) – Tikrarmti Apps

## Daftar Isi

1. [Pengantar](#pengantar)
2. [Teknologi & Stack](#teknologi--stack)
3. [Struktur Proyek](#struktur-proyek)
4. [Arsitektur Autentikasi](#arsitektur-autentikasi)
5. [Middleware](#middleware)
6. [Server Layout](#server-layout)
7. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
8. [Session Management](#session-management)
9. [API Routes](#api-routes)
10. [Data Fetching](#data-fetching)
11. [Observability](#observability)
12. [Keamanan](#keamanan)
13. [Referensi](#referensi)

---

## Pengantar

Dokumen ini merupakan revisi arsitektur resmi Tikrarmti Apps yang dibangun menggunakan **Next.js 14** (App Router) dan **Supabase**. Revisi ini bertujuan menyederhanakan kompleksitas, menghilangkan redundansi autentikasi, serta menegaskan prinsip keamanan berbasis database (RLS-first) tanpa mengurangi tingkat keamanan aplikasi.

### Prinsip Revisi

- **RLS as Source of Truth**: Row Level Security adalah single source of truth untuk otorisasi data. Server tidak boleh memiliki logic duplikat yang bertentangan dengan RLS.
- **Cookie-Based Session Only**: Hanya gunakan HttpOnly cookie untuk session. Tidak ada localStorage/sessionStorage untuk token autentikasi.
- **Single Responsibility per Layer**: Setiap layer memiliki tanggung jawab tunggal - Middleware redirect, Server Layout validasi session, RLS otorisasi data.
- **Server-Centric Security**: Semua validasi keamanan dilakukan di server. Client hanya untuk presentasi.

---

## Teknologi & Stack

### Core Technologies

| Teknologi | Versi | Penggunaan |
|-----------|-------|------------|
| Next.js | 14+ | Framework React dengan App Router |
| React | 18+ | Library UI |
| TypeScript | 5+ | Type safety |
| Supabase | Latest | Backend-as-a-Service (Auth, Database, Storage) |
| TailwindCSS | Latest | Styling |
| Radix UI | Latest | Komponen UI yang accessible |
| SWR | Latest | Data fetching dan caching client-side (UI helper only) |
| Zod | Latest | Validasi schema |

### Development Tools

- **ESLint**: Linting kode
- **Prettier**: Formatting kode
- **Husky**: Git hooks untuk pre-commit checks
- **Sentry**: Error tracking dan monitoring

---

## Struktur Proyek

```
tikrarmti.apps/
├── app/                          # Next.js App Router
│   ├── (protected)/              # Group route untuk halaman terproteksi
│   │   ├── layout.tsx           # Server-side auth guard
│   │   ├── dashboard/
│   │   ├── perjalanan-saya/
│   │   └── pendaftaran/
│   ├── (public)/                 # Group route untuk halaman publik
│   ├── api/                      # API Routes (mutation only)
│   │   └── auth/
│   ├── login/
│   ├── register/
│   ├── auth/                     # Auth callback pages
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/                    # Komponen React reusable
│   ├── ui/                       # Komponen UI dasar (Radix UI)
│   ├── dashboard/                # Komponen khusus dashboard
│   └── layouts/                  # Komponen layout client
├── hooks/                         # Custom React hooks (UI helpers)
│   └── useBatchTimeline.ts       # Hanya untuk UI state management
├── lib/                           # Utility functions dan configurations
│   ├── supabase/                 # Supabase client configurations
│   │   ├── server.ts             # Server client (primary)
│   │   └── client.ts             # Browser client (minimal use)
│   ├── supabase.ts               # TypeScript definitions
│   └── api-responses.ts          # Standard response formats
├── supabase/                      # Supabase migrations dan functions
│   └── migrations/
│       ├── add_users_rls_policies.sql
│       └── cleanup_and_fix_rls_policies.sql
├── middleware.ts                  # Next.js middleware (redirect-only)
├── docs/                          # Dokumentasi
│   └── arsitektur-supabase-nextjs.md
└── scripts/                       # Utility scripts
```

### Konvensi Penamaan File

| Jenis File | Konvensi | Contoh |
|------------|----------|--------|
| Component | PascalCase | `UserProfile.tsx` |
| Hook | camelCase dengan `use` prefix | `useBatchTimeline.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type Definition | PascalCase dengan `.types` suffix | `User.types.ts` |
| API Route | lowercase dengan kebab-case | `app/api/auth/login/route.ts` |

---

## Arsitektur Autentikasi

### Prinsip Autentikasi

Arsitektur autentikasi Tikrarmti Apps mengikuti pola **sederhana dan server-centric**:

1. **Middleware**: Hanya melakukan redirect berdasarkan keberadaan session cookie. Tidak fetch Supabase.
2. **Server Layout**: Validasi session di server component. Auth guard utama untuk protected routes.
3. **RLS**: Otorisasi data sepenuhnya di database layer. Server hanya pre-check untuk UX yang lebih baik.

### Flow Autentikasi (Sederhana)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SIMPLIFIED LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

User                 Next.js                    Supabase                Database
 │                       │                          │                        │
 │  1. Submit Login      │                          │                        │
 ├─────────────────────>│                          │                        │
 │                       │                          │                        │
 │                       │  2. signInWithPassword() │                        │
 │                       ├─────────────────────────>│                        │
 │                       │                          │                        │
 │                       │  3. Set HttpOnly Cookie  │  4. Validate Creds     │
 │                       │<─────────────────────────├──────────────────────>│
 │  5. Redirect to Dashboard                        │                        │
 │<─────────────────────┤                          │                        │
 │                       │                          │                        │
 │  6. Load Protected Page                          │                        │
 │                       │  7. Server Layout Validasi│                        │
 │                       ├─────────────────────────>│                        │
 │  8. Render dengan User Data (RLS Filtered)       │                        │
 │<─────────────────────┤                          │                        │
```

### Perbedaan dengan Versi Sebelumnya

| Aspek | Versi Lama | Versi Revisi |
|-------|-----------|--------------|
| Storage | Cookie + localStorage | **Cookie only** |
| Middleware | Fetch Supabase, refresh session | **Redirect only** |
| Client Auth Hook | SWR fetch `/api/auth/user` | **Dihapus**, server layout provides data |
| RBAC | Server + RLS (duplikat) | **RLS only**, server pre-check optional |

---

## Middleware

**File**: `middleware.ts`

### Implementasi

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Cek keberadaan session cookie (tidak fetch Supabase)
  const hasSessionCookie = req.cookies.get('sb-access-token') ||
                           req.cookies.get('sb-refresh-token')

  const protectedRoutes = ['/dashboard', '/perjalanan-saya', '/pendaftaran']
  const publicRoutes = ['/login', '/register', '/forgot-password']
  const isApiRoute = pathname.startsWith('/api')

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Redirect ke login jika tidak ada cookie
  if (isProtectedRoute && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect ke dashboard jika sudah ada cookie
  if (isPublicRoute && hasSessionCookie && !isApiRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### Aturan Middleware

- **Redirect Only**: Middleware hanya melakukan redirect, tidak fetch Supabase
- **Cookie Check**: Cek keberadaan session cookie, bukan validasi session
- **Fast Execution**: Middleware harus secepat mungkin, tidak ada network calls
- **Single Responsibility**: Tanggung jawab hanya routing, bukan autentikasi

---

## Server Layout

**File**: `app/(protected)/layout.tsx`

### Implementasi

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Validasi session - ini adalah auth guard utama
  const { data: { session }, error } = await supabase.auth.getSession()

  if (!session || error) {
    redirect('/login')
  }

  // Fetch user data (akan difilter oleh RLS)
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    redirect('/login')
  }

  // Pass user data ke client component via props
  return (
    <ProtectedClientLayout
      user={user}
      session={session}
    >
      {children}
    </ProtectedClientLayout>
  )
}
```

### Aturan Server Layout

- **Auth Guard**: Server layout adalah auth guard utama untuk protected routes
- **Session Validation**: Validasi session dilakukan di sini, bukan di middleware
- **User Data Fetch**: Fetch user data di server, pass ke client via props
- **RLS Trusted**: Data yang di-fetch sudah difilter oleh RLS, server tidak perlu filter lagi
- **No Client Auth Hook**: Tidak perlu `useAuth` hook yang fetch `/api/auth/user`

---

## Role-Based Access Control (RBAC)

### Prinsip RBAC

RBAC di Tikrarmti Apps mengikuti prinsip **RLS-First**:

1. **RLS sebagai Source of Truth**: Semua otorisasi data ada di RLS policies
2. **Server Pre-Check**: Server boleh melakukan pre-check untuk UX yang lebih baik, tapi bukan pengganti RLS
3. **Client untuk UX**: Client hanya menampilkan/menyembunyikan UI berdasarkan role, bukan untuk security

### Roles

| Role | Deskripsi |
|------|-----------|
| `user` | User standar, akses data sendiri |
| `staff` | Musyrifah/Muallimah, akses semua santri |
| `admin` | Administrator, akses penuh |

### RLS Policies

**File**: `supabase/migrations/add_users_rls_policies.sql`

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Staff can view all users
CREATE POLICY "Staff can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

-- Policy: Admins have full access
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Server Pre-Check (Optional)

Server boleh melakukan pre-check untuk redirect early jika user tidak memiliki akses:

```typescript
// Server component untuk admin-only page
export default async function AdminPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Pre-check: Fetch user role untuk UX redirect
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  // Redirect jika bukan admin (UX, bukan security - security ada di RLS)
  if (user?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Render admin page (RLS akan memastikan hanya admin yang bisa akses data)
  return <AdminDashboard />
}
```

### Aturan RBAC

- **RLS is Mandatory**: RLS **wajib** ada untuk semua tabel dengan data user
- **Server Pre-Check Optional**: Pre-check di server hanya untuk UX, bukan pengganti RLS
- **Client for UX**: Client hanya hide/show UI, jangan gunakan untuk security decisions
- **No Role in JWT**: Jangan simpan role di JWT/cookie, selalu query dari database

---

## Session Management

### Prinsip Session Management

Tikrarmti Apps menggunakan **cookie-based session only**:

1. **HttpOnly Cookie**: Session token disimpan di HttpOnly cookie
2. **No LocalStorage**: Tidak ada token di localStorage/sessionStorage
3. **Automatic Refresh**: Supabase SSr handle automatic token refresh
4. **Server Access**: Cookie otomatis dikirim ke server untuk setiap request

### Cookie Configuration

**File**: `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Method not available in Server Component
          }
        },
      },
    }
  )
}
```

### Aturan Session Management

- **HttpOnly Cookie Only**: Hanya gunakan HttpOnly cookie untuk session
- **No LocalStorage**: Dilarang menyimpan token di localStorage/sessionStorage
- **No Manual Token Management**: Jangan manual manage token refresh, biarkan Supabase SSR handle
- **Cookie Security**: Cookie harus memiliki flag `HttpOnly`, `Secure`, dan `SameSite`

---

## API Routes

### Prinsip API Routes

API routes di Tikrarmti Apps hanya digunakan untuk **mutation operations**:

1. **Mutation Only**: API routes hanya untuk create, update, delete operations
2. **No Data Fetching**: Data fetching dilakukan di server component, bukan via API
3. **Input Validation**: Semua input divalidasi dengan Zod
4. **RLS Applies**: RLS tetap berlaku untuk semua database operations

### Contoh API Route

**File**: `app/api/user/update/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema dengan Zod
const updateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone_number: z.string().regex(/^[0-9]+$/).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const result = updateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      )
    }

    // Update user (RLS akan memastikan user hanya bisa update dirinya sendiri)
    const { data, error } = await supabase
      .from('users')
      .update(result.data)
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Aturan API Routes

- **Mutation Only**: API routes hanya untuk mutations (CUD), bukan queries (R)
- **Zod Validation**: Semua input **wajib** divalidasi dengan Zod
- **Error Handling**: Return consistent error response format
- **No Password Handling**: Jangan handle password di API, gunakan Supabase Auth
- **RLS Applies**: Database operations di API tetap difilter oleh RLS

---

## Data Fetching

### Prinsip Data Fetching

Tikrarmti Apps menggunakan pendekatan **server-centric** untuk data fetching:

1. **Server Component**: Data fetching utama dilakukan di server component
2. **RLS Filtering**: Data sudah difilter oleh RLS di database level
3. **SWR for UI**: SWR hanya digunakan untuk UI state management, bukan untuk data fetching sensitif
4. **No Duplicate Fetch**: Jangan fetch data yang sama di server dan client

### Server Components (Primary)

```typescript
// ✅ GOOD: Server component untuk data fetching
async function DashboardPage() {
  const supabase = createClient()

  // Fetch data di server (RLS filtered)
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .single()

  const { data: jurnal } = await supabase
    .from('jurnal_harian')
    .select('*')
    .order('created_at', { ascending: false })

  return <Dashboard user={user} jurnal={jurnal} />
}
```

### Client Components with SWR (UI Helper Only)

```typescript
// ✅ GOOD: SWR untuk UI state management saja
'use client'

import useSWR from 'swr'

// Hanya untuk data non-sensitif atau polling updates
function JurnalCounter() {
  const { data: count } = useSWR('/api/jurnal/count', {
    refreshInterval: 5000, // Polling untuk live updates
  })

  return <div>Total Jurnal: {count}</div>
}
```

```typescript
// ❌ BAD: Fetching sensitive data di client
'use client'

import useSWR from 'swr'

function UserProfile() {
  // Jangan fetch sensitive data via API di client
  const { data: user } = useSWR('/api/user')

  return <div>{user?.email}</div>
}
```

### Aturan Data Fetching

- **Server First**: Selalu fetch data di server component bila memungkinkan
- **RLS Trusted**: Data dari server sudah difilter RLS, aman ditampilkan ke client
- **SWR for UI**: SWR hanya untuk UI helpers (polling, optimistic updates), bukan untuk sensitive data
- **No Duplicate Fetch**: Jangan fetch data yang sama di server dan client

---

## Observability

### Error Handling

#### Error Boundary

**File**: `app/error.tsx`

```typescript
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error ke error tracking service (Sentry)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="error-container">
      <h2>Terjadi kesalahan</h2>
      <button onClick={reset}>Coba lagi</button>
    </div>
  )
}
```

#### Server-Side Logging

```typescript
// Log error di server component
export default async function Page() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')

    if (error) throw error

    return <Page data={data} />
  } catch (error) {
    // Log ke error tracking service
    console.error('Server error:', error)
    throw error // Error Boundary akan catch
  }
}
```

### Aturan Observability

- **Error Boundary**: Gunakan Error Boundary untuk catch React errors
- **Server Logging**: Log error di server untuk debugging
- **Sentry**: Setup Sentry untuk production error tracking
- **No Sensitive Data**: Jangan log sensitive data (password, token, dll)

---

## Keamanan

### Security Checklist

Setiap fitur baru **harus** memenuhi checklist ini:

- [ ] Route terproteksi dengan middleware (redirect-only)
- [ ] Server layout validasi session
- [ ] RLS policies ada dan sudah di-test
- [ ] Input divalidasi dengan Zod
- [ ] Output di-sanitasi (prevent XSS)
- [ ] Error messages tidak expose sensitive info
- [ ] Rate limiting untuk API endpoints
- [ ] HttpOnly cookie untuk session
- [ ] HTTPS enforced di production
- [ ] No localStorage untuk token

### Security Best Practices

#### 1. RLS adalah Pertahanan Terakhir

```sql
-- RLS harus selalu aktif
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Policy yang restrictive
CREATE POLICY "Restrictive policy"
  ON sensitive_data
  FOR ALL
  USING (auth.uid() = user_id);
```

#### 2. Input Validation dengan Zod

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const result = schema.safeParse(input)
if (!result.success) {
  return { error: 'Invalid input' }
}
```

#### 3. Output Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify'

function sanitizeUserInput(html: string): string {
  return DOMPurify.sanitize(html)
}
```

#### 4. Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

const { success } = await ratelimit.limit(ip)
if (!success) {
  return { error: 'Too many requests' }
}
```

### Aturan Keamanan

- **RLS Mandatory**: RLS wajib untuk semua tabel dengan data user
- **No LocalStorage Token**: Dilarang menyimpan token di localStorage
- **HttpOnly Cookie**: Session cookie harus HttpOnly dan Secure
- **Input Validation**: Semua input divalidasi dengan Zod
- **Error Messages**: Jangan expose sensitive info di error messages
- **HTTPS**: HTTPS enforced di production
- **Rate Limiting**: Rate limiting untuk API endpoints

---

## Referensi

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org)

---

**Dokumen ini adalah living document. Revisi ini menyederhanakan arsitektur dengan prinsip RLS-first dan server-centric security. Jika ada perubahan arsitektur atau pattern baru, update dokumen ini.**

Untuk pertanyaan atau clarifications, hubungi tech lead.
