# 07 — PR Checklist (Definition of Done)

Checklist wajib sebelum klik "Merge". Salin ke deskripsi PR atau pakai sebagai self-review.

## Pra-PR (Self-Review Lokal)

### Quality Gates

- [ ] `npm run lint` hijau (tidak ada error & warning baru).
- [ ] `npm run type-check` hijau.
- [ ] `npm run build` sukses (sangat dianjurkan untuk PR signifikan).
- [ ] Tidak ada `console.log` / `debugger` / `// TODO` tanpa konteks tertinggal di diff.

### Code Hygiene

- [ ] Tidak ada `any` baru tanpa justifikasi.
- [ ] Tidak ada `// @ts-ignore` baru. Pakai `// @ts-expect-error <alasan>` bila benar-benar perlu.
- [ ] Tidak ada import dari `lib/auth-middleware.ts` (deprecated). Pakai `lib/rbac.ts`.
- [ ] Tidak ada cek role `userData.role === 'admin'`. Pakai `roles?.includes('admin')`.
- [ ] Tidak ada `error.message` / `error.hint` / `error.code` Supabase di response API.
- [ ] Tidak ada hardcoded role di registrasi publik (selalu `'thalibah'` di server).
- [ ] Tidak ada secret / token / PII di diff (cek dengan teliti `.env`, JSON dump, ID pribadi).

### Konsistensi Codebase

- [ ] File baru ditempatkan sesuai konvensi ([02-coding-standards.md §Struktur Folder](02-coding-standards.md)).
- [ ] Komponen mengikuti pohon keputusan di [05-component-guide.md](05-component-guide.md).
- [ ] Tidak menambahkan library baru tanpa diskusi (toast, form, http client, dll).
- [ ] Stack pinned tetap: Next 14.2.35 + React 18.3.1.

## API Endpoint Baru / Berubah

Lihat [04-api-development.md §Checklist Endpoint Baru](04-api-development.md).

- [ ] Rate limiter dipasang (paling awal di handler).
- [ ] Auth check via `lib/rbac.ts`.
- [ ] Input divalidasi (Zod schema atau whitelist enum).
- [ ] UUID query param divalidasi sebelum query DB.
- [ ] Pagination clamped (`page ≥ 1`, `limit ≤ 100`).
- [ ] Response pakai helper `ApiResponses.*`.
- [ ] Pemilihan client tepat (`createServerClient` vs `createSupabaseAdmin`).
- [ ] Logging dengan konteks (bukan PII).
- [ ] Origin / CSRF check tidak di-bypass.

## Perubahan UI

- [ ] Diuji di browser untuk **golden path** (alur sukses utama).
- [ ] Diuji untuk **edge case**: input invalid, jaringan lambat/error, data kosong.
- [ ] Loading / Empty / Error state tertangani.
- [ ] Responsive di breakpoint mobile (375px) dan desktop (≥1024px).
- [ ] Tombol submit disable selama in-flight.
- [ ] Konfirmasi destruktif pakai `AlertDialog` (bukan `window.confirm`).
- [ ] String UI dalam Bahasa Indonesia & ramah pengguna.
- [ ] Aksesibilitas dasar: label form, focus state, kontras warna.
- [ ] Screenshot **sebelum** & **sesudah** dilampirkan di PR.

## Perubahan Database

Lihat [06-database-changes.md §Checklist Perubahan DB](06-database-changes.md).

- [ ] File migrasi `supabase/migrations/YYYYMMDD_*.sql`.
- [ ] SQL idempoten.
- [ ] RLS aktif + policy eksplisit untuk tabel baru.
- [ ] Index untuk kolom filter/join.
- [ ] `npm run gen-types` dijalankan, `types/supabase.ts` ter-commit.
- [ ] Sudah di-apply di staging & diverifikasi.
- [ ] Plan rollback ditulis di deskripsi PR.
- [ ] Dokumen `docs/database/*.md` ter-update bila relevan.

## Keamanan

- [ ] Tidak ada endpoint baru yang publik tanpa rate limit.
- [ ] Tidak ada operasi sensitif (delete, role change) tanpa konfirmasi role di server.
- [ ] Tidak ada query yang mempercayai input user untuk filter ownership (`WHERE user_id = $1` harus `auth.uid()` atau diverifikasi server).
- [ ] Tidak ada string user dimasukkan langsung ke HTML (`dangerouslySetInnerHTML`) tanpa sanitasi (`dompurify`).
- [ ] Tidak ada upload tanpa validasi mime/ukuran.
- [ ] reCAPTCHA terpasang untuk form registrasi & form publik.

## Dependency

- [ ] `package.json` & `package-lock.json` ter-commit bersamaan.
- [ ] Dependency baru tidak duplikat dengan yang sudah ada (cek toast, form lib, dll).
- [ ] Tidak menambah dependency hanya untuk 1 utility kecil — tulis manual atau pakai yang sudah ada.
- [ ] Tidak menggunakan dependency dengan vulnerability known (`npm audit` tidak menampilkan high/critical baru).

## Observability

- [ ] Path error penting log via `logger.*` (bukan `console.*`).
- [ ] Sentry tidak di-mute / di-bypass.
- [ ] Tidak menambah noise log (loop log, debug message di production).

## Dokumentasi

- [ ] README / docs di-update bila perubahan mempengaruhi setup atau alur user.
- [ ] Endpoint baru punya JSDoc minimal.
- [ ] Komponen reusable baru punya contoh pakai (di JSDoc atau di PR description).
- [ ] Aturan baru (kalau ada) di-tambah ke dokumen development relevan.

## Git Hygiene

- [ ] Branch dari `main` ter-update (rebased atau merged dari `main`).
- [ ] Commit mengikuti Conventional Commits ([03-git-workflow.md](03-git-workflow.md)).
- [ ] PR title & body sesuai template.
- [ ] Diff fokus — tidak ada file generated/build yang seharusnya tidak di-commit.
- [ ] Ukuran PR <400 baris (atau ada justifikasi mengapa tidak bisa dipecah).

## Risk Assessment

Tulis di deskripsi PR:

- **Risk level:** low / medium / high
- **Blast radius:** route mana yang terpengaruh
- **Rollback path:** cukup `git revert`? Perlu rollback migrasi? Perlu downtime?

## Setelah Merge

- [ ] Pantau Sentry & log production 30 menit pertama.
- [ ] Verifikasi fitur jalan di production (smoke test).
- [ ] Bila ada migrasi DB: verifikasi sudah dieksekusi & types ter-update.
- [ ] Update dokumen plan/feature bila mengakhiri suatu inisiatif.

---

## Snippet PR Body (Template)

```markdown
## Summary
- <apa yang berubah & kenapa>

## Changes
- <bullet ringkas perubahan utama>

## Test Plan
- [ ] <langkah verifikasi golden path>
- [ ] <langkah edge case>
- [ ] `npm run lint` hijau
- [ ] `npm run type-check` hijau
- [ ] (UI) Diuji di browser mobile & desktop
- [ ] (DB) Migrasi dijalankan di staging

## Screenshots
<sebelum & sesudah, untuk perubahan UI>

## Risk & Rollback
- Risk: <low|medium|high>
- Rollback: <cara revert; perlu langkah tambahan?>

## Related
- Issue / Plan: <link>
- Migrasi: <path file SQL bila ada>
```

---

*Selesai. Kembali ke [README development](README.md).*
