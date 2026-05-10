# 01 — Getting Started

Panduan setup environment lokal dari nol sampai bisa menjalankan aplikasi.

## Prasyarat

| Tool | Versi Minimum | Catatan |
|------|---------------|---------|
| Node.js | 18.17+ | Disarankan LTS terbaru |
| npm | 9+ | Bawaan Node.js |
| Git | 2.30+ | |
| Akun Supabase | — | Akses ke project `nmbvklixthlqtkkgqnjl` |

> **Stack pinned:** Next.js **14.2.35** + React **18.3.1**. Jangan upgrade ke Next 16 / React 19 — ada beberapa breaking change yang sudah pernah dicoba dan di-rollback.

## 1. Clone & Install

```bash
git clone <repository-url>
cd tikrarmti.apps
npm install
```

Jangan gunakan `--force` atau `--legacy-peer-deps` kecuali ada arahan khusus. Jika install gagal, laporkan error-nya — bukan dipaksakan.

## 2. Environment Variables

Salin template:

```bash
cp .env.example .env.local
```

Isi kunci wajib (minta ke admin tim untuk nilai produksi/staging):

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (aman di browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Service role** — server-only, jangan pernah di-expose |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3006` untuk dev |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | ⚠️ | Wajib untuk halaman registrasi |
| `RECAPTCHA_SECRET_KEY` | ⚠️ | Wajib di server saat verifikasi reCAPTCHA |
| `UPSTASH_REDIS_REST_URL` | ⚠️ | Wajib di production untuk rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ | Pasangan dari URL di atas |

> Lihat [`lib/env.ts`](../../lib/env.ts) untuk daftar lengkap variabel & validasinya. Jika variabel kritis hilang, server **akan crash di startup** — ini disengaja (Fail Fast).

### Aturan Keamanan Env

- ❌ Jangan commit `.env.local` (sudah di-`.gitignore`).
- ❌ Jangan tambahkan prefix `NEXT_PUBLIC_` ke kunci yang seharusnya server-only — itu akan ter-bundle ke browser.
- ❌ Jangan share `SUPABASE_SERVICE_ROLE_KEY` lewat Slack/email tanpa enkripsi.
- ✅ Tambah variabel baru ke `.env.example` (dengan placeholder dummy) sekaligus saat membuat fitur baru.

## 3. Database Setup

Skema sumber kebenaran ada di Supabase project `nmbvklixthlqtkkgqnjl`. Untuk bekerja lokal:

```bash
# Generate types TypeScript dari schema Supabase live
npm run gen-types
```

Output ditulis ke [`types/supabase.ts`](../../types/supabase.ts). Jalankan ulang setiap kali ada migrasi baru.

> Migrasi disimpan di [`supabase/migrations/`](../../supabase/migrations/). Lihat [06-database-changes.md](06-database-changes.md) untuk workflow membuat migrasi baru.

## 4. Jalankan Dev Server

```bash
npm run dev
```

Aplikasi terbuka di **<http://localhost:3006>** (port di-pin di `package.json`).

### Verifikasi setup berhasil

1. Buka <http://localhost:3006> — homepage harus render tanpa error console.
2. Login dengan akun test (minta ke tim).
3. Cek halaman `/dashboard` bisa load tanpa error 500.

## 5. Scripts Tersedia

```bash
# Pengembangan
npm run dev               # Dev server (port 3006)
npm run build             # Production build (regenerate build info)
npm run start             # Production server lokal

# Quality gates — wajib sebelum push
npm run lint              # ESLint
npm run type-check        # TypeScript strict check (tsc --noEmit)

# Utilitas
npm run gen-types                # Regenerate types/supabase.ts
npm run generate-build-info      # Regenerate build metadata
npm run debug:jurnal             # Cek isi jurnal harian (debug)
npm run test:block-mapping       # Validasi mapping blok hafalan
```

## 6. Editor & Tooling

### VS Code (rekomendasi)

Ekstensi minimal:

- ESLint
- Tailwind CSS IntelliSense
- Prettier (opsional — proyek belum pakai Prettier konfigurasi sendiri)

Settings:

```json
{
  "editor.formatOnSave": false,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

> Format-on-save dimatikan supaya tidak merubah file di luar yang sedang dikerjakan. Bersihkan formatting hanya di area diff Anda.

## 7. Troubleshooting

| Gejala | Sebab umum | Solusi |
|--------|-----------|--------|
| `Module not found: @/lib/...` | Path alias tidak terdeteksi | Restart TS server di VS Code (`Cmd+Shift+P` → *TypeScript: Restart TS Server*) |
| Build crash: `Missing env: NEXT_PUBLIC_SUPABASE_URL` | `.env.local` tidak terbaca | Pastikan file ada di root, restart `npm run dev` |
| Login redirect loop | Cookie sesi rusak / RLS reject | Clear cookies untuk localhost, login ulang |
| `Invalid Refresh Token` di console | Sesi expired di Supabase | Logout via UI, jangan hapus row di DB manual |
| `npm install` lambat / hang | Cache npm korup | `rm -rf node_modules package-lock.json && npm install` (terakhir, baru lapor) |
| Port 3006 sudah dipakai | Proses dev sebelumnya nyangkut | `lsof -ti:3006 \| xargs kill -9` |

Jika masalah tidak ada di tabel di atas: cek `.next/` log, lalu tanya di channel tim **sebelum** mencoba solusi destruktif (hapus DB, reset git, dll).

## 8. Yang Tidak Boleh Dilakukan di Awal

- ❌ Menjalankan migrasi langsung ke Supabase production.
- ❌ Menggunakan `SUPABASE_SERVICE_ROLE_KEY` di kode client (`'use client'` files).
- ❌ Menonaktifkan ESLint atau TypeScript check ("nanti aja diperbaikinya").
- ❌ Commit `users.json`, `.env.local`, atau hasil dump database.
- ❌ Mengganti versi Next.js / React tanpa diskusi tim.

---

Lanjut ke → [02-coding-standards.md](02-coding-standards.md)
