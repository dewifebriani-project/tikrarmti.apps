import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const faqData = [
  {
    category: "Program Umum",
    icon: "BookOpen",
    color: "green",
    questions: [
      {
        q: "Apa itu Program Tahfidz Tikrar MTI?",
        a: "Program Tahfidz Tikrar MTI adalah program hafalan Al-Qur'an gratis yang menggunakan metode Tikrar 40x. Program ini khusus untuk Ibu rumah tangga dan remaja putri yang serius ingin menghafal Al-Qur'an dengan komitmen waktu minimal 2 jam per hari."
      },
      {
        q: "Apakah program ini benar-benar gratis?",
        a: "Ya, program ini 100% gratis. Tidak ada biaya pendaftaran, biaya bulanan, atau biaya tersembunyi apa pun. Program ini didukung oleh Muallimah dan Musyrifah profesional yang berdedikasi."
      },
      {
        q: "Siapa saja yang bisa bergabung dengan program ini?",
        a: "Program ini terbuka untuk Ibu rumah tangga dan remaja putri yang sudah bisa membaca Al-Qur'an dengan tajwid yang benar. Peserta harus bersedia berkomitmen penuh selama 13 pekan dan memiliki waktu sekitar 2 jam per hari untuk menghafal."
      },
      {
        q: "Apa yang membedakan program ini dengan program tahfidz lainnya?",
        a: "Program ini menggunakan metode Tikrar 40x yang terbukti efektif, memiliki sistem yang terstruktur dengan 7 kurikulum wajib harian dan 2 kurikulum tambahan, didampingi Musyrifah yang berdedikasi, dan memiliki komunitas yang saling mendukung. Target yang realistis (1/4 halaman per hari) membuat program ini cocok untuk ibu rumah tangga."
      }
    ]
  },
  {
    category: "Metode Belajar",
    icon: "Shield",
    color: "blue",
    questions: [
      {
        q: "Apa itu Metode Tikrar 40x?",
        a: "Metode Tikrar 40x adalah metode hafalan dengan mengulang bacaan ayat sebanyak 40 kali. Metode ini terdiri dari 7 tahapan: Rabth (menyambung hafalan), Muraja'ah blok terakhir, Simak murattal, Tikrar dengan melihat mushaf (40x), Tasmi' via rekaman, Simak rekaman pribadi, dan Tikrar tanpa mushaf (40x)."
      },
      {
        q: "Mengapa harus 40 kali pengulangan?",
        a: "Pengulangan 40 kali berdasarkan penelitian bahwa otak manusia membutuhkan pengulangan yang konsisten untuk menyimpan informasi ke memori jangka panjang."
      },
      {
        q: "Berapa target hafalan per hari?",
        a: "Target hafalan adalah 1/4 halaman per hari atau satu halaman per pekan. Target ini disesuaikan agar tidak terlalu berat untuk ibu rumah tangga yang harus menyeimbangkan dengan rutinitas sehari-hari."
      },
      {
        q: "Apakah harus hafal Latin Arab sebelum bergabung?",
        a: "Tidak wajib, tapi sangat disarankan. Memahami makhraj dan tajwid yang benar akan membantu proses hafalan menjadi lebih efektif. Program akan memberikan tes bacaan saat seleksi."
      }
    ]
  },
  {
    category: "Waktu & Komitmen",
    icon: "Clock",
    color: "yellow",
    questions: [
      {
        q: "Berapa lama durasi program ini?",
        a: "Program berlangsung selama 13 pekan (sekitar 3 bulan). Selama periode ini, peserta diharapkan konsisten mengikuti semua tahapan pembelajaran."
      },
      {
        q: "Apakah harus online setiap hari pada jam tertentu?",
        a: "Iya. Peserta dapat menyesuaikan jadwal belajar sesuai waktu luang masing-masing. Namun, harus melakukan setoran harian kepada pasangan yang telah ditentukan. Penjadwalan akan disesuaikan dengan zona waktu masing-masing peserta."
      },
      {
        q: "Bagaimana jika terlewat satu hari setoran?",
        a: "Tidak disarankan untuk terlewat. Program ini membutuhkan konsistensi tinggi. Jika terpaksa terlewat, peserta harus memberitahu Musyrifah dan mengulang hari tersebut. Namun, jika sering terlewat tanpa alasan yang syar'i, peserta dapat dikeluarkan dari program (blacklist permanen)."
      },
      {
        q: "Apakah ada toleransi untuk cuti atau libur?",
        a: "Toleransi hanya diberikan untuk alasan syar'i yang valid (misal: sakit berat dengan surat dokter, atau keringanan lain yang ditandatangani ketika akad). Selain itu, peserta diharapkan konsisten selama 13 pekan."
      }
    ]
  },
  {
    category: "Sistem & Aturan",
    icon: "AlertCircle",
    color: "red",
    questions: [
      {
        q: "Apa itu sistem blacklist?",
        a: "Sistem blacklist adalah konsekuensi bagi peserta yang keluar dari program tanpa alasan syar'i yang jelas. Peserta yang masuk blacklist tidak dapat lagi bergabung dengan program MTI di masa mendatang. Ini demi menjaga komitmen dan hak peserta lain yang ingin bergabung."
      },
      {
        q: "Bagaimana sistem pembelajaran berjalan?",
        a: "Setiap peserta akan mendapatkan: jadwal hafalan harian, pasangan setoran, bimbingan dari Musyrifah, akses ke grup WhatsApp/Telegram untuk tanya jawab, dan template laporan harian yang harus diisi."
      },
      {
        q: "Apakah ada ujian selama program?",
        a: "Ya, ada beberapa ujian: tes bacaan awal saat seleksi, ujian pekanan dengan mu'allimah, dan ujian akhir untuk penentuan kelulusan."
      },
      {
        q: "Bagaimana jika tidak bisa menghafal target harian?",
        a: "Peserta harus berjuang maksimal untuk mencapai target. Jika kesulitan, segera diskusikan dengan Musyrifah. Dibutuhkan kejujuran dalam melaporkan progres hafalan."
      }
    ]
  },
  {
    category: "Pasangan Setoran & Komunitas",
    icon: "Users",
    color: "purple",
    questions: [
      {
        q: "Apa itu pasangan setoran?",
        a: "Pasangan setoran adalah teman satu batch yang akan menjadi partner untuk saling menyetorkan hafalan. Setiap peserta wajib melakukan setoran 40 kali kepada pasangannya dan mendengarkan setoran pasangannya 40 kali."
      },
      {
        q: "Bagaimana jika pasangan setoran tidak cocok?",
        a: "Peserta harus professional dan tetap berkomunikasi dengan baik. Jika ada masalah serius, laporkan ke Musyrifah melalui aplikasi untuk penanganan lebih lanjut. Ini adalah bagian dari belajar bersama dan toleransi."
      },
      {
        q: "Apakah ada komunitas alumni?",
        a: "Ya, lulusan program akan bergabung dengan komunitas alumni MTI yang terus saling mendukung dalam perjalanan tahfidz masing-masing. Ada program lanjutan bagi yang ingin melanjutkan ke juz berikutnya."
      },
      {
        q: "Bagaimana interaksi dengan Musyrifah?",
        a: "Musyrifah akan aktif memantau progres setiap peserta melalui laporan harian, memberikan feedback secara berkala, dan tersedia untuk konsultasi jika ada kesulitan dalam menghafal."
      }
    ]
  },
  {
    category: "Persiapan & Pendaftaran",
    icon: "CheckCircle",
    color: "indigo",
    questions: [
      {
        q: "Apa saja persyaratan untuk mendaftar?",
        a: "Persyaratan: (1) Muslimah, (2) Bisa membaca Al-Qur'an dengan tajwid, (3) Komitmen waktu 2 jam/hari, (4) Memiliki mushaf Qur'an Tikrar dan HP untuk rekaman, (5) Siap mengikuti aturan main, dan (6) Menyelesaikan simulasi Tikrar An-Naba' 1-11 x 40 kali."
      },
      {
        q: "Bagaimana proses pendaftarannya?",
        a: "Proses: (1) Mengisi formulir pendaftaran, (2) Mengerjakan simulasi Tikrar, (3) Tes bacaan online, (4) Seleksi berkas, (5) Pengumuman kelulusan, (6) Penjadwalan halaqah dan pasangan setoran."
      },
      {
        q: "Kapan pendaftaran dibuka?",
        a: "Pendaftaran dibuka setiap awal kuartal. Informasi pendaftaran akan diumumkan melalui Instagram MTI dan grup alumni. Pastikan mengikuti akun resmi untuk update terbaru."
      },
      {
        q: "Apa saja yang perlu disiapkan sebelum program mulai?",
        a: "Yang perlu disiapkan: Qur'an Tikrar , HP dengan kapasitas penyimpanan cukup untuk rekaman, headset dengan mikrofon baik, jurnal/catatan khusus untuk tracking progress, dan waktu yang terjadwal setiap hari."
      }
    ]
  },
  {
    category: "Setelah Lulus",
    icon: "Award",
    color: "emerald",
    questions: [
      {
        q: "Apakah dapat sertifikat setelah lulus?",
        a: "Ya, peserta yang lulus akan mendapatkan sertifikat resmi dari MTI sebagai bukti telah menyelesaikan program hafalan dengan metode Tikrar 40x."
      },
      {
        q: "Apakah ada program lanjutan setelah lulus?",
        a: "Ya, ada program lanjutan untuk melanjutkan hafalan ke juz berikutnya. Alumni juga mendapatkan prioritas untuk bergabung dengan program lanjutan dan akses ke kelas-kelas pengembangan MTI lainnya."
      }
    ]
  }
];

async function main() {
  console.log('Clearing old faqs...');
  await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Inserting complete faqs...');
  const { data, error } = await supabase.from('faqs').insert(
    faqData.map((f, i) => ({
      category: f.category,
      icon: f.icon,
      color: f.color,
      questions: f.questions,
      sort_order: i + 1
    }))
  );
  
  if (error) {
    console.error('Error inserting FAQs:', error);
  } else {
    console.log('Successfully inserted all FAQs!');
  }
}

main();
