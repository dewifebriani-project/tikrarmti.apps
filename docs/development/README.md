# Panduan Pengembangan Tikrarmti Apps

Direktori ini berisi **dokumen wajib** yang harus dibaca sebelum berkontribusi ke codebase. Tujuannya: menjaga konsistensi gaya kode, kestabilan rilis, dan keamanan aplikasi seiring tim & fitur bertambah.

## Urutan Baca

| # | Dokumen | Untuk |
|---|---------|-------|
| 1 | [01-getting-started.md](01-getting-started.md) | Setup environment, install, troubleshooting |
| 2 | [02-coding-standards.md](02-coding-standards.md) | TypeScript, React, penamaan, struktur file |
| 3 | [03-git-workflow.md](03-git-workflow.md) | Branching, commit, pull request |
| 4 | [04-api-development.md](04-api-development.md) | Pola API route, validasi, error handling |
| 5 | [05-component-guide.md](05-component-guide.md) | Komponen UI, shadcn, state, hooks |
| 6 | [06-database-changes.md](06-database-changes.md) | Migrasi, RLS, perubahan skema |
| 7 | [07-pr-checklist.md](07-pr-checklist.md) | Definition of Done — wajib sebelum merge |

## Dokumen Acuan Lainnya

Dokumen di sini **melengkapi** — bukan menggantikan — dokumen acuan teknis yang sudah ada:

- [architecture/arsitektur.md](architecture/arsitektur.md) — *Single Source of Truth* arsitektur, RBAC, keamanan API.
- [architecture/SECURITY_GUIDELINES.md](architecture/SECURITY_GUIDELINES.md) — Panduan keamanan rinci.
- [architecture/SENTRY_FILTERING_GUIDE.md](architecture/SENTRY_FILTERING_GUIDE.md) — Konfigurasi filter Sentry.
- [architecture/system-monitoring-implementation.md](architecture/system-monitoring-implementation.md) — Implementasi monitoring & error logging.
- [auth/SESSION_MANAGEMENT.md](auth/SESSION_MANAGEMENT.md) — Cara session 7-hari bekerja.
- [database/DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md) — Skema database.
- [database/rls-policies.md](database/rls-policies.md) — RLS aktif per tabel.
- [features/auto-create-halaqah.md](features/auto-create-halaqah.md) — Spesifikasi fitur auto-create halaqah.
- [alur_aplikasi.md](alur_aplikasi.md) — Alur bisnis aplikasi (onboarding → kelulusan).

## Prinsip Pengembangan

1. **Server-Side Authority** — keamanan, role, dan validasi di server. Tidak pernah percaya client.
2. **RLS as Final Guard** — kebijakan RLS adalah benteng terakhir, bukan satu-satunya.
3. **Fail Fast** — konfigurasi kritis hilang → crash di startup, bukan di request user.
4. **Whitelist, not Blacklist** — input divalidasi via enum / Zod schema yang eksplisit.
5. **Konsistensi > Kreativitas** — ikuti pola yang sudah ada sebelum membuat pola baru.
6. **Hapus Sebelum Menambah** — jika sebuah pola sudah deprecated (`auth-middleware.ts`, kolom `role` tunggal), jangan tambahkan pemakaian baru.

## Aturan Tidak Boleh Dilanggar (Ringkas)

> Lihat [architecture/arsitektur.md §9](architecture/arsitektur.md#9-aturan-yang-tidak-boleh-dilanggar) untuk daftar lengkap & alasannya.

- Gunakan `lib/rbac.ts` untuk auth API, bukan `lib/auth-middleware.ts`.
- Cek role dengan `roles?.includes('admin')`, bukan `role === 'admin'`.
- Jangan return `error.message` / `error.hint` Supabase ke client.
- Hardcode `role: 'thalibah'` di registrasi publik.
- Validasi UUID & whitelist enum sebelum query DB.

---

*Last updated: 2026-05-07*
