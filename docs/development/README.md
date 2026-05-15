# Panduan Pengembangan Tikrarmti Apps

Direktori ini berisi dokumentasi pengembangan Tikrarmti Apps.

## Single Source of Truth

Dokumen referensi teknis utama untuk semua developer adalah:

**[DEVELOPER_REFERENCE.md](../DEVELOPER_REFERENCE.md)**

Dokumen ini menggabungkan semua informasi teknis yang sebelumnya tersebar di file-file terpisah. Gunakan ini sebagai rujukan utama untuk:
- Quick start dan setup environment
- Arsitektur sistem
- Tech stack & versi
- Struktur repositori
- Routing & halaman
- Data model & database
- Server actions & API
- Autentikasi & RBAC
- Komponen UI & design system
- State management & data fetching
- Coding conventions
- Keamanan & compliance
- Roadmap teknis

## File yang Tersisa

| File | Deskripsi | Status |
|------|-----------|--------|
| `DEVELOPER_REFERENCE.md` | Single source of truth teknis | ✅ Aktif |

## Prinsip Pengembangan

1. **Server-Side Authority** — keamanan, role, dan validasi di server. Tidak pernah percaya client.
2. **RLS as Final Guard** — kebijakan RLS adalah benteng terakhir, bukan satu-satunya.
3. **Fail Fast** — konfigurasi kritis hilang → crash di startup, bukan di request user.
4. **Whitelist, not Blacklist** — input divalidasi via enum / Zod schema yang eksplisit.
5. **Konsistensi > Kreativitas** — ikuti pola yang sudah ada sebelum membuat pola baru.
6. **Hapus Sebelum Menambah** — jika sebuah pola sudah deprecated (`auth-middleware.ts`, kolom `role` tunggal), jangan tambahkan pemakaian baru.

## Mulai Kontribusi

1. Baca **[DEVELOPER_REFERENCE.md](../DEVELOPER_REFERENCE.md)** dari awal sampai selesai.
2. Setup environment lokal sesuai Quick Start.
3. Pilih issue/fitur dari roadmap.
4. Ikuti coding conventions di §12.
5. Jalankan quality gates sebelum commit (`npm run lint`, `npm run type-check`).

---

*Last updated: 2026-05-14*
