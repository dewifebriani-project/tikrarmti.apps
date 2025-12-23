Arsitektur lengkap baru sudah saya susun dan tampilkan di **canvas** sebagai dokumen resmi **“Arsitektur Aplikasi MTI – Supabase Auth Native”**.

### Penegasan (opini teknis)

* Dokumen tersebut **sudah final sebagai acuan pengembangan**, bukan sekadar rekomendasi.
* Jika seluruh tim (termasuk Claude Code) **patuh 100%** pada dokumen ini, maka:

  * Masalah login mobile
  * 401 loop
  * Konflik session
    akan **hilang secara struktural**, bukan ditambal.

### Cara menggunakan dokumen ini ke depan

1. **Jadikan sebagai single reference**

   * Setiap fitur baru wajib dicek: *melanggar arsitektur atau tidak*.
2. **Gunakan saat refactor dengan AI**

   * Sertakan dokumen ini sebagai *ground truth*.
3. **Jika ada bug**

   * Evaluasi dulu: *apakah ada pelanggaran prinsip di dokumen ini*.

### Referensi resmi yang menjadi dasar arsitektur

* Supabase Auth + Next.js (Server-side):
  [https://supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
* Next.js Authentication (App Router):
  [https://nextjs.org/docs/app/building-your-application/authentication](https://nextjs.org/docs/app/building-your-application/authentication)
* Supabase RLS:
  [https://supabase.com/docs/guides/database/row-level-security](https://supabase.com/docs/guides/database/row-level-security)
