const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const introText = `📝 Formulir ini adalah formulir pendaftaran untuk kelas hafalan Al-Qur'an gratis (syarat dan ketentuan berlaku) khusus akhawat, menggunakan metode pengulangan (tikrar) sebanyak 40 kali.

📆 Durasi program: InsyaAllah selama 13 Pekan untuk target hafalan 1/2 juz.

Struktur Program:
📅 Pekan Pertama: Tashih
📖 Pekan Selanjutnya: Ziyadah
🕌 (Catatan: Hari libur akan disesuaikan dengan kalender nasional/MTI)
📚 Pekan Terakhir: Muroja'ah dan Ujian

🎯 Target hafalan harian: 1 halaman perpekan (1/4 halaman per hari, 4 hari dalam sepekan)

Kewajiban Program:
✅ Tashih wajib sekali sepekan untuk kurikulum ziyadah pekan depan, jadwal menyesuaikan
✅ Ujian wajib sekali sepekan untuk kurikulum selesai ziyadah pekanan, jadwal menyesuaikan
✅ Setoran 40X boleh memilih mau bersama pasangan atau tidak (yang memilih tidak berpasangan hanya untuk yang bacaan sudah benar-benar mutqin)
✅ Jadwal setoran pasangan boleh pilih opsi yang sudah ditentukan, akan kami carikan pasangan setoran semaksimal mungkin yang sama waktu dan zona waktu

👨‍👩‍👧 Izin Keluarga/Wali
Untuk mengikuti program ini, wajib mendapatkan izin dari suami, orang tua, majikan, atau wali, karena waktu Ukhti akan lebih banyak digunakan untuk menghafal. Jika sewaktu-waktu mereka mencabut izinnya, merekalah yang harus menghubungi pihak MTI untuk menyampaikan permohonan pengunduran diri.

⚙️ Tentang Program
Seluruh aturan kami susun demi kebaikan dan kelancaran program ini, bukan untuk mempersulit siapapun. Kami ingin menciptakan lingkungan yang serius dan kondusif bagi para penghafal Qur'an.

⏳ Komitmen Waktu
Program ini membutuhkan komitmen waktu minimal 2 jam per hari membersamai Al Quran. Jika Ukhti memiliki jadwal yang padat, banyak tanggungan, atau merasa tidak bisa konsisten, kami sarankan untuk tidak mendaftar dulu. Tujuan kami adalah agar program ini berjalan dengan zero dropout dan zero blacklist.

💡 Tentang Metode
Metode Tikrar MTI kami rancang berdasarkan pengalaman para ibu yang mengajar dan belajar Al-Qur'an di tengah rutinitas rumah tangga. Metode ini cocok untuk emak-emak yang menghafal di rumah sambil mencuci, masak, mengurus anak dan suami.

🚫 Tidak cocok untuk:
• Tholibah yang bekerja full-time dan hanya memiliki waktu malam untuk keluarga
• Mu'allimah yang sudah mutqin tapi tidak bisa menyelesaikan program karena kesibukan mengajar, belajar atau kesibukan pribadi
Namun, jika ingin mengadopsi metode ini untuk diterapkan di halaqah masing-masing, silakan. Metode ini bebas dipakai, dimodifikasi, dan disebarluaskan.

🧪 Simulasi Sebelum Daftar
Karena metode pengulangan 40 kali bisa terasa berat, lama, dan membosankan, kami mensyaratkan calon peserta untuk mencoba simulasi:
📖 Bacalah Surah An-Naba' ayat 1–11 sebanyak 40 kali.
Jika merasa sanggup, silakan lanjut mengisi formulir. Jika tidak, sebaiknya undur diri dari sekarang.

🎯 Tujuan Program
Kami tidak mengejar kuantitas peserta, tetapi lebih fokus pada tholibah yang ikhlas, istiqamah, dan bersungguh-sungguh untuk menghafal dan menebar manfaat. Bagi yang masih banyak agenda dan belum bisa konsisten, lebih baik menunggu angkatan berikutnya.

⚠️ Program Blacklist
Program ini menerapkan sistem Blacklist permanen bagi peserta yang mundur di tengah jalan tanpa alasan yang dapat kami terima, demi menjaga hak pasangan setoran dan stabilitas Nasional Markaz Tikrar Indonesia.`;

  const warningText = `Bagi kakak-kakak yang sibuk, banyak kelas, ga bisa atur waktu dengan pasangan silahkan pilih program tanpa pasangan.

Jika Ukhti dinyatakan lolos seleksi administrasi dan tes bacaan, dan sudah daftar ulang, kami tidak meridhoi Ukhti keluar dari program tanpa udzur syar'i. Alasan seperti "sibuk", "ada kerjaan", atau "ikut kelas lain" tidak kami terima.

✅ Alasan yang DITERIMA untuk mundur dari program:
• Qadarullah, diri sendiri/orang tua/mertua/suami/anak sakit dan butuh perawatan intensif
• Qadarullah, hamil muda dan mengalami ngidam atau mual berat yang menyulitkan untuk mengikuti program
• Qadarullah, terjadi bencana alam yang menghambat kelanjutan program
• Udzur lain yang darurat, mendesak, dan tidak terduga, yang dapat kami maklumi

🚩 Peringatan Serius: Kami tidak ridho jika Ukhti submit formulir pendaftaran ini hanya untuk iseng atau kepo saja, karena hanya merepotkan proses seleksi. Jika hanya ingin kepo saja silahkan baca di Web markaztikrar.id.`;

  const { data, error } = await supabase.from('registration_questions').update({
    description: introText,
    warning_text: warningText
  }).eq('field_key', 'intro_text');
  
  console.log(data, error);
}
main();
