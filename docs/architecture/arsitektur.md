Dokumen Arsitektur (Final Revisi V3) – Tikrarmti Apps

Daftar Isi

Pengantar

Prinsip Arsitektur

Teknologi & Stack

Struktur Proyek

Arsitektur Autentikasi

Middleware (The Cookie Refresher)

Server Layout (The Security Gate)

Role-Based Access Control (RBAC)

Session Management

Mutation Handling

Data Fetching & Performance

Keamanan

1. Pengantar

Dokumen ini adalah acuan teknis final ("Single Source of Truth") untuk pengembangan Tikrarmti Apps. Dokumen ini disusun berdasarkan best-practice Supabase SSR dan keterbatasan teknis Next.js 14 App Router.

2. Prinsip Arsitektur

Prinsip Utama

Server-Side Validation Only: Client tidak pernah dipercaya untuk validasi sesi atau hak akses.

RLS as Authority: Keamanan data mutlak berada di level database (Row Level Security).

Middleware for Persistence: Middleware bertugas "menulis ulang" cookie sesi agar user tidak logout tiba-tiba (karena keterbatasan Server Component).

Strict User Verification: Menggunakan getUser() bukan getSession() untuk gerbang keamanan utama.

3. Teknologi & Stack

Teknologi

Penggunaan

Next.js 14

App Router, Server Actions

Supabase SSR

Auth & Cookie Management (@supabase/ssr)

PostgreSQL

Database & RLS Policies

Zod

Validasi Input (Schema)

React 18

UI Components

4. Struktur Proyek

tikrarmti.apps/
├── app/
│   ├── (protected)/        # GROUP: Halaman butuh login
│   │   ├── layout.tsx      # SECURITY GATE (getUser Check)
│   │   ├── dashboard/
│   │   └── ...
│   ├── auth/               # Route Handler
│   │   └── callback/       # Penukar Code -> Session
│   │       └── route.ts
│   ├── login/
│   └── layout.tsx          # Root Layout
├── lib/
│   └── supabase/
│       ├── server.ts       # Client untuk Server Component/Action
│       └── middleware.ts   # Client khusus Middleware
├── middleware.ts           # Global Middleware
└── ...



5. Arsitektur Autentikasi

Alur Request (The Lifecycle)

Request Masuk: User membuka halaman /dashboard.

Middleware: Mengecek cookie. Jika token hampir habis, middleware me-refresh token dan menulis cookie baru ke browser (Penting!).

Server Layout: Memanggil supabase.auth.getUser().

Valid ke server Supabase? -> Lanjut.

Tidak valid/Banned? -> Redirect /login.

Page Render: Fetch data.

Database (RLS): Memfilter data berdasarkan auth.uid().

6. Middleware (The Cookie Refresher)

MENGAPA WAJIB ADA?
Meskipun Server Component bisa me-refresh token, mereka tidak bisa menyimpan token baru tersebut ke browser (keterbatasan Next.js Streaming). Tanpa middleware, user akan mengalami loop refresh yang lambat atau logout paksa.

Kode: middleware.ts

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession:
  // 1. Cek token
  // 2. Refresh jika perlu
  // 3. Kembalikan Response dengan header Set-Cookie baru
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Match semua path kecuali static files & images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}



Kode Helper: lib/supabase/middleware.ts

(Standard boilerplate dari dokumentasi Supabase SSR)

7. Server Layout (The Security Gate)

Ini adalah satu-satunya tempat di mana kita memutuskan user boleh masuk atau ditendang keluar.

Kode: app/(protected)/layout.tsx

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // PENTING: Gunakan getUser(), bukan getSession()
  // getUser() memverifikasi token langsung ke server Supabase Auth.
  // Ini mencegah penggunaan token palsu atau token usang.
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <>{children}</>
}



8. Role-Based Access Control (RBAC)

Jangan Lakukan Ini di Client/Component:
❌ if (user.role === 'admin') { showAdminButton() } // Tidak aman untuk proteksi data

Lakukan Ini:
✅ Gunakan RLS Policy di Database.
✅ UI hanya menyembunyikan menu untuk UX, tapi keamanan tetap di DB.

Contoh Policy (SQL)

-- Hanya Admin yang boleh UPDATE tabel settings
CREATE POLICY "Admin Update Settings"
ON app_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);



9. Session Management

Cookie Name: Default Supabase (sb-<ref>-auth-token).

Configuration: Diatur otomatis oleh @supabase/ssr (Secure, HttpOnly, SameSite).

Handling: 100% otomatis.

Manual Touch: DILARANG. Jangan set/get cookie auth secara manual.

10. Mutation Handling

Gunakan Server Actions untuk mengubah data. Ini memastikan kode berjalan di server yang aman.

Contoh: actions/update-user.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function updateUser(formData: FormData) {
  const supabase = createClient()
  
  // 1. Validasi Auth (Double check, meski RLS sudah cover)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Validasi Data
  // ... Zod parsing ...

  // 3. Eksekusi DB
  const { error } = await supabase
    .from('profiles')
    .update(parsedData)
    .eq('id', user.id) // RLS akan memvalidasi ini juga

  if (error) return { error: error.message }
  return { success: true }
}



11. Data Fetching & Performance

Pattern Utama

Fetch data langsung di komponen halaman (page.tsx) sebagai Server Component.

Parallel Data Fetching

Jika mengambil data dari beberapa tabel, jangan gunakan await berurutan (Waterfall). Gunakan Promise.all untuk performa maksimal.

// app/(protected)/dashboard/page.tsx
export default async function Dashboard() {
  const supabase = createClient()

  // ✅ Good Practice: Parallel Fetching
  const [userData, todosData] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('todos').select('*') // RLS Applied
  ])
  
  return (
    <main>
       <UserProfile data={userData.data} />
       <TodoList data={todosData.data} />
    </main>
  )
}



Streaming & Suspense

Untuk komponen yang memuat data lambat, bungkus dengan <Suspense> agar UI tidak blocking.

12. Keamanan

Checklist Audit:

$$$$

 Middleware terpasang dan memanggil updateSession.

$$$$

 Halaman terproteksi berada di dalam group route (protected) yang memiliki layout getUser().

$$$$

 RLS Policy aktif (ALTER TABLE ... ENABLE ROW LEVEL SECURITY) untuk semua tabel.

$$$$

 Tidak ada eksposur SERVICE_ROLE_KEY di client side env.