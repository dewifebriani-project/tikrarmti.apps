import re

with open("/Users/dewifebrinani/.gemini/antigravity/brain/7be8cd8f-2dc2-46de-84c1-8cea03fccd77/implementation_plan.md", "w") as f:
    f.write("""# Peningkatan Alur Daftar Ulang, User Journey, dan Kasus Pengecualian (Revision)

Dokumen ini berisi rencana implementasi untuk memperbaiki dan meningkatkan alur daftar ulang serta menyelesaikan masalah edge-case pada user journey (terutama kasus admin meminta rekam ulang VN setelah tanggal pendaftaran ditutup).

## User Review Required

> [!IMPORTANT]
> **Keputusan Desain: Kasus Rekam Ulang VN (Revision)**
> Jika Admin meminta thalibah merekam ulang VN, namun tanggal seleksi batch sudah ditutup, thalibah saat ini tidak bisa mengupload ulang. 
> **Usulan Solusi:**
> 1. Kita tambahkan tombol **"Minta Rekam Ulang" (Request Re-record)** di dashboard admin (Manajemen Ujian / Seleksi).
> 2. Tombol ini akan otomatis:
>    - Menghapus file VN lama.
>    - Mengosongkan nilai seleksi (score) yang sudah sempat diisi.
>    - Mengubah status thalibah menjadi `needs_revision` atau memberikan flag `allow_late_submission = true`.
> 3. Di UI Thalibah (Perjalanan Saya), jika statusnya `needs_revision`, tombol upload VN akan **terbuka kembali** meskipun tanggal batas waktu (deadline) batch sudah lewat.
> 
> *Mohon konfirmasi apakah alur tombol "Minta Rekam Ulang" ini sesuai dengan keinginan Anda.*

## Open Questions

- Untuk **Donasi**, saat ini saya buat berupa input ketik angka (misal user mengetik 50000). Apakah ini sudah cukup, atau Anda ingin UI berupa tombol-tombol pilihan cepat (Chip) bertuliskan "25.000", "50.000", "75.000", dll agar user tinggal klik?

## Proposed Changes

### Database (Supabase)

#### [MODIFY] pendaftaran_tikrar_tahfidz
- Menambahkan kolom `needs_revision` (boolean, default false) untuk menangani kasus pengecualian tanggal bagi thalibah yang diminta mengulang upload.

### Komponen Perjalanan Saya (User Journey)

#### [MODIFY] `app/(protected)/perjalanan-saya/page.tsx`
- Memastikan semua tahapan (Pendaftaran, Daftar Ulang, dll) tersinkronisasi dengan mengecek tanggal dari `batch` (seperti `registration_end_date`, `selection_end_date`, `re_enrollment_end_date`).
- Menambahkan logika pengecualian: Jika pendaftaran memiliki flag `needs_revision == true`, maka tombol aksi (seperti Upload VN) akan tetap aktif terlepas dari tanggal batas waktu batch.

### Dashboard Admin

#### [MODIFY] `app/(protected)/admin/pendaftaran/page.tsx` (atau halaman evaluasi terkait)
- Menambahkan tombol/aksi **"Minta Rekam Ulang"** untuk admin.
- API endpoint baru untuk memproses aksi ini (menghapus file di storage, reset nilai `oral_total_score`, set `needs_revision = true`).

## Verification Plan

### Manual Verification
- Login sebagai thalibah di batch yang tanggal seleksinya sudah lewat. Pastikan tombol upload tertutup.
- Login sebagai admin, berikan flag "Minta Rekam Ulang" ke thalibah tersebut.
- Login kembali sebagai thalibah, pastikan tombol upload VN kini terbuka dan bisa mengirimkan VN baru.
- Periksa form daftar ulang (Pilihan pengabdian dan komitmen donasi) dan pastikan data diri tidak kosong lagi.
""")
