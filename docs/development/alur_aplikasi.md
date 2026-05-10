# Alur Aplikasi Markaz Tikrar Indonesia (MTI)

Dokumen ini menjelaskan alur kerja (workflow) aplikasi MTI dari perspektif pengguna (Thalibah) dan manajemen (Admin/Staf).

## 1. Fase Persiapan (Onboarding)
*   **Registrasi & Login**: Calon Thalibah membuat akun melalui email/password. Akun otomatis aktif (auto-confirm) tanpa perlu verifikasi email manual.
    *   *Security*: Role selalu di-set `thalibah` di server — tidak pernah diambil dari input user.
    *   *Security*: Tanggal lahir divalidasi server-side: harus di masa lalu (tidak ada batasan minimal/maksimal usia).
*   **Lengkapi Profil**: Setiap pengguna yang baru pertama kali masuk **wajib** melengkapi profil di halaman `/lengkapi-profile`.
    *   *System Guard*: Selama profil belum lengkap, Thalibah akan diarahkan kembali ke halaman ini.
    *   *Data Core*: Nama lengkap, alamat, No. WhatsApp, dan data dasar lainnya.

## 2. Fase Pendaftaran & Seleksi (Registration)
*   **Pendaftaran Program**: Pengguna memilih Batch yang sedang aktif di dashboard.
    *   Memilih **Target Juz** (misal: Juz 30-A, 30-B, dll).
    *   Memilih **Slot Waktu** utama dan cadangan untuk setoran lisan.
*   **Proses Seleksi**: Terdiri dari dua komponen utama:
    *   **Ujian Tulis**: Mengerjakan kuesioner atau tes dasar di aplikasi.
    *   **Ujian Lisan**: Thalibah mengirimkan rekaman audio/video sebagai bukti awal hafalan.
*   **Penilaian Staf**: Admin/Muallimah menilai hasil seleksi dan memperbarui status menjadi `selected` (lulus) atau `not_selected`.

## 3. Fase Administrasi Akhir (Enrollment)
*   **Daftar Ulang**: Thalibah yang lulus seleksi masuk ke menu `/daftar-ulang`.
    *   Menyetujui **Akad Belajar**.
    *   Konfirmasi komitmen waktu dan kehadiran.
*   **Aktivasi**: Setelah daftar ulang selesai, status thalibah di database diperbarui menjadi `active` pada batch tersebut.

## 4. Siklus Belajar Harian (Daily Workflow)
Inti dari aplikasi adalah aktivitas harian thalibah yang terdiri dari dua langkah wajib:

### Step 1: Tashih (Validasi Bacaan)
Sebelum menghafal secara mandiri, thalibah wajib melakukan Tashih bersama Muallimah untuk memastikan tidak ada kesalahan tajwid atau makhraj.
*   Input lokasi (MTI/Luar).
*   Memilih Muallimah pendamping.
*   Mencatat jumlah kesalahan tajwid dan catatan koreksi.

### Step 2: Jurnal Harian (Kurikulum 7-Tahap Tikrar)
Setelah bacaan benar, thalibah menjalankan metode **Tikrar** (pengulangan) yang terdiri dari:
1.  **Rabth**: Mengulang-ulang 10 blok terakhir (1x).
2.  **Murajaah**: Mengulang hafalan tanpa melihat mushaf (minimal 5x).
3.  **Simak Murattal**: Mendengarkan qari (minimal 3x).
4.  **Tikrar Bi An-Nadzar**: Mengulang dengan melihat mushaf.
5.  **Tasmi' Record**: Merekam bacaan sendiri dan melakukan evaluasi (minimal 3x).
6.  **Simak Record**: Mendengarkan kembali hasil rekaman sendiri.
7.  **Tikrar Bi Al-Ghaib**: Mengulang hafalan dengan menutup mata (minimal 40x).
*   *Opsional*: **Tafsir** (mempelajari makna) dan **Menulis** (melatih penulisan ayat).

## 5. Sistem Monitoring & Kedisiplinan
*   **Dashboard Stats**: Menampilkan progres bar Tashih & Jurnal, serta jumlah hari aktif.
*   **Surat Peringatan (SP)**: Sistem memantau kedisiplinan pengisian jurnal.
    *   **SP 1, 2, 3**: Diterbitkan jika thalibah tidak aktif selama periode tertentu.
    *   **Drop Out (DO)**: Jika mencapai ambang batas ketidakhadiran, status berubah menjadi `dropout` secara sistem.

## 6. Evaluasi & Kelulusan (Assessment)
*   **Perjalanan Saya**: Timeline visual yang merekam setiap milestone thalibah.
*   **Ujian Akhir (Pekan 13)**: Ujian hafalan juz di hadapan Muallimah.
*   **Wisuda & Sertifikat (Pekan 14)**:
    *   Thalibah yang lulus dapat mengunduh **Sertifikat Digital** otomatis di menu `/kelulusan-sertifikat`.

## 7. Peran & Manajemen (Hierarchical RBAC)
*   **Admin (Rank 100)**: Pengelola pusat. Memiliki fitur **Preview Mode** untuk melihat semua halaman santri.
*   **Musyrifah (Rank 80)**: Pengawas kedisiplinan & penerbit SP.
*   **Muallimah (Rank 60)**: Pengajar/Penguji Tashih dan Ujian Akhir.
*   **Thalibah (Rank 40)**: Santri aktif.

---
*Terakhir Diperbarui: 3 Mei 2026 — Integrasi Alur Operasional & Kurikulum Tikrar*
