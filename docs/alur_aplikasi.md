# Alur Aplikasi Markaz Tikrar Indonesia (MTI)

Dokumen ini menjelaskan alur kerja (workflow) aplikasi MTI dari perspektif pengguna (Thalibah) dan manajemen (Admin/Staf).

## 1. Fase Persiapan (Onboarding)
*   **Registrasi & Login**: Calon Thalibah membuat akun melalui email/password atau login cepat menggunakan Google OAuth.
*   **Lengkapi Profil**: Setiap pengguna yang baru pertama kali masuk **wajib** melengkapi profil.
    *   *System Guard*: Selama profil belum lengkap, Thalibah akan diarahkan kembali ke halaman `/lengkapi-profile`.
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

## 4. Fase Belajar (The 14-Week Journey)
Inti dari aplikasi adalah siklus belajar selama 14 pekan:
*   **Pekan 1 - Opening Class**: Orientasi bersama seluruh santri dalam satu batch.
*   **Pekan 2 s.d 11 - Inti Pembelajaran (Tikrar)**:
    *   **Jurnal Harian**: Thalibah mengisi laporan harian (berapa kali ayat diulang/tikrar).
    *   **Monitoring Musyrifah**: Musyrifah memantau keaktifan jurnal. Jika sering bolong, akan muncul peringatan (SP).
    *   **Tashih & Halaqah**: Muallimah memberikan koreksi bacaan pada thalibah. Semua catatan tersimpan secara digital.
*   **Pekan 12 - Muraja'ah**: Minggu khusus pengulangan hafalan intensif untuk persiapan ujian.

## 5. Fase Evaluasi & Kelulusan (Assessment)
*   **Pekan 13 - Ujian Akhir**: Thalibah menempuh ujian hafalan juz yang diambil di hadapan Muallimah.
*   **Pekan 14 - Wisuda & Sertifikat**:
    *   Pengumuman kelulusan semester/batch.
    *   Thalibah yang lulus dapat mengunduh **Sertifikat Digital** otomatis di menu `/kelulusan-sertifikat`.

## 6. Peran & Manajemen
*   **Admin**: Mengelola infrastruktur (Batch, Juz, Program, Hak Akses).
*   **Muallimah (Guru)**: Melakukan penilaian seleksi, mengisi record Tashih, dan memberi nilai ujian.
*   **Musyrifah (Pengawas/Wali)**: Memantau kedisiplinan dan memberikan Surat Peringatan (SP) bagi thalibah yang kurang aktif.

---
*Terakhir Diperbarui: 28 Maret 2026*
