// Generate Excel file for Juz 28 exam questions from Google Form
// This script creates an Excel file with the EXACT data provided by the user
// Run with: npx tsx scripts/generate-juz28-excel.ts

import * as xlsx from 'xlsx';

// EXACT data from Google Form - DO NOT IMPROVISE
const questions = [
  // SECTION 2: TEBAK NAMA SURAT (20 questions)
  [2, 'Tebak Nama Surat', 1, 'ٱلنَّجْمُ ٱلثَّاقِبُ', 'multiple_choice', 'Ath-Thariq', 'Al-Ghasiyah', 'Al-Buruj', 'An-Naba', '1', 1],
  [2, 'Tebak Nama Surat', 2, 'وَٱلسَّمَآءِ وَٱلطَّارِقِ', 'multiple_choice', 'Ath-Thariq', 'Al-Buruj', 'Al-Infitar', 'Al-Mutaffifin', '1', 1],
  [2, 'Tebak Nama Surat', 3, 'عَبَسَ وَتَوَلَّىٰٓ', 'multiple_choice', 'Abasa', 'An-Naba', "An-Nazi'at", 'At-Takwir', '1', 1],
  [2, 'Tebak Nama Surat', 4, 'إِذَا ٱلسَّمَآءُ ٱنفَطَرَتْ', 'multiple_choice', 'Al-Infitar', 'Al-Inshiqaq', 'Al-Mutaffifin', 'Abasa', '1', 1],
  [2, 'Tebak Nama Surat', 5, 'يُسَبِّحُ لِلَّهِ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ', 'multiple_choice', 'Al-Hadid', 'Al-Mujadila', 'At-Taghabun', 'Al-Mulk', '1', 1],
  [2, 'Tebak Nama Surat', 6, 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى ٱلَّذِى خَلَقَ فَسَوَّىٰ', 'multiple_choice', "Al-A'la", 'Al-Ghasiyah', 'Al-Fajr', 'Al-Balad', '1', 1],
  [2, 'Tebak Nama Surat', 7, 'هَلْ أَتَىٰكَ حَدِيثُ ٱلْغَٰشِيَةِ', 'multiple_choice', 'Al-Ghasiyah', "Al-A'la", 'Al-Fajr', 'Ad-Duhaa', '1', 1],
  [2, 'Tebak Nama Surat', 8, 'وَٱلْفَجْرِ وَلَيَالٍ عَشْرٍ', 'multiple_choice', 'Al-Fajr', 'Ad-Duhaa', 'Al-Inshirah', 'Al-Balad', '1', 1],
  [2, 'Tebak Nama Surat', 9, 'لَآ أُقْسِمُ بِهَٰذَا ٱلْبَلَدِ', 'multiple_choice', 'Al-Balad', 'Al-Fajr', 'Ash-Shams', 'Ad-Duhaa', '1', 1],
  [2, 'Tebak Nama Surat', 10, 'وَٱلشَّمْسِ وَضُحَىٰهَا', 'multiple_choice', 'Ash-Shams', 'Ad-Duhaa', 'Al-Lail', 'Al-Fajr', '1', 1],
  [2, 'Tebak Nama Surat', 11, 'وَٱلضُّحَىٰ وَمَا سَوَّىٰ', 'multiple_choice', 'Ad-Duhaa', 'Ash-Shams', 'Al-Lail', 'Al-Inshirah', '1', 1],
  [2, 'Tebak Nama Surat', 12, 'وَٱللَّيْلِ إِذَا يَغْشَىٰ', 'multiple_choice', 'Al-Lail', 'Ad-Duhaa', 'Ash-Shams', 'Al-Fajr', '1', 1],
  [2, 'Tebak Nama Surat', 13, 'أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ', 'multiple_choice', 'Al-Inshirah', 'Ad-Duhaa', 'Al-Lail', 'At-Tin', '1', 1],
  [2, 'Tebak Nama Surat', 14, 'وَٱلتِّينِ وَٱلزَّيْتُونِ', 'multiple_choice', 'At-Tin', 'Al-Inshirah', 'Al-Alaq', 'Al-Qadr', '1', 1],
  [2, 'Tebak Nama Surat', 15, 'إِنَّآ أَنزَلْنَٰهُ فِى لَيْلَةِ ٱلْقَدْرِ', 'multiple_choice', 'Al-Qadr', 'At-Tin', 'Al-Alaq', 'Al-Bayyinah', '1', 1],
  [2, 'Tebak Nama Surat', 16, 'ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ', 'multiple_choice', 'Al-Alaq', 'At-Tin', 'Al-Qadr', 'Al-Bayyinah', '1', 1],
  [2, 'Tebak Nama Surat', 17, 'لَمْ يَكُنِ ٱلَّذِينَ كَفَرُوا۟ مِنْ أَهْلِ ٱلْكِتَٰبِ', 'multiple_choice', 'Al-Bayyinah', 'Al-Qadr', 'Al-Alaq', 'Az-Zalzalah', '1', 1],
  [2, 'Tebak Nama Surat', 18, 'إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا', 'multiple_choice', 'Az-Zalzalah', 'Al-Bayyinah', "Al-'Adiyat", "Al-Qari'ah", '1', 1],
  [2, 'Tebak Nama Surat', 19, 'وَٱلْعَٰدِيَٰتِ ضَبْحًا', 'multiple_choice', "Al-'Adiyat", 'Az-Zalzalah', "Al-Qari'ah", 'Al-Takathur', '1', 1],
  [2, 'Tebak Nama Surat', 20, 'ٱلْقَارِعَةُ', 'multiple_choice', "Al-Qari'ah", "Al-'Adiyat", 'Az-Zalzalah', 'Al-Takathur', '1', 1],

  // SECTION 3: TEBAK AYAT (5 questions)
  [3, 'Tebak Ayat', 1, 'وَٱلسَّمَآءِ وَٱلطَّارِقِ', 'multiple_choice', 'Ath-Thariq: 1', 'Al-Buruj: 1', 'Al-Infitar: 1', 'Al-Mutaffifin: 1', '1', 1],
  [3, 'Tebak Ayat', 2, 'وَمَآ أَدْرَىٰكَ مَا ٱلطَّارِقُ', 'multiple_choice', 'Ath-Thariq: 2', 'Al-Buruj: 2', 'Al-Infitar: 2', 'Al-Mutaffifin: 2', '1', 1],
  [3, 'Tebak Ayat', 3, 'ٱلنَّجْمُ ٱلثَّاقِبُ', 'multiple_choice', 'Ath-Thariq: 3', 'Al-Buruj: 3', 'Al-Infitar: 3', 'Al-Mutaffifin: 3', '1', 1],
  [3, 'Tebak Ayat', 4, 'إِن كُلُّ نَفْسٍ لَّمَّا عَلَيْهَا حَافِظٌ', 'multiple_choice', 'Ath-Thariq: 4', 'Al-Buruj: 4', 'Al-Infitar: 4', 'Al-Mutaffifin: 4', '1', 1],
  [3, 'Tebak Ayat', 5, 'فَلْيَنظُرِ ٱلْإِنسَٰنُ مِمَّ خُلِقَ', 'multiple_choice', 'Ath-Thariq: 5', 'Al-Buruj: 5', 'Al-Infitar: 5', 'Al-Mutaffifin: 5', '1', 1],

  // SECTION 4: SAMBUNG SURAT (3 questions)
  [4, 'Sambung Surat', 1, 'وَٱلسَّمَآءِ ذَاتِ ٱلْبُرُوجِ', 'multiple_choice', 'Al-Buruj', 'Ath-Thariq', 'Al-Infitar', 'Al-Mutaffifin', '1', 1],
  [4, 'Sambung Surat', 2, 'وَٱلْيَوْمِ ٱلْمَوْعُودِ', 'multiple_choice', 'Al-Buruj', 'Ath-Thariq', 'Al-Infitar', 'Al-Mutaffifin', '1', 1],
  [4, 'Sambung Surat', 3, 'وَشَاهِدٍ وَمَشْهُودٍ', 'multiple_choice', 'Al-Buruj', 'Ath-Thariq', 'Al-Infitar', 'Al-Mutaffifin', '1', 1],

  // SECTION 5: TEBAK AWAL AYAT (5 questions)
  [5, 'Tebak Awal Ayat', 1, 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى', 'multiple_choice', 'Al-A\'la: 1', 'Al-Ghasiyah: 1', 'Al-Fajr: 1', 'Al-Balad: 1', '1', 1],
  [5, 'Tebak Awal Ayat', 2, 'هَلْ أَتَىٰكَ حَدِيثُ ٱلْغَٰشِيَةِ', 'multiple_choice', 'Al-Ghasiyah: 1', 'Al-A\'la: 1', 'Al-Fajr: 1', 'Ad-Duhaa: 1', '1', 1],
  [5, 'Tebak Awal Ayat', 3, 'وَٱلْفَجْرِ وَلَيَالٍ عَشْرٍ', 'multiple_choice', 'Al-Fajr: 1', 'Ad-Duhaa: 1', 'Al-Inshirah: 1', 'Al-Balad: 1', '1', 1],
  [5, 'Tebak Awal Ayat', 4, 'لَآ أُقْسِمُ بِهَٰذَا ٱلْبَلَدِ', 'multiple_choice', 'Al-Balad: 1', 'Al-Fajr: 1', 'Ash-Shams: 1', 'Ad-Duhaa: 1', '1', 1],
  [5, 'Tebak Awal Ayat', 5, 'وَٱلشَّمْسِ وَضُحَىٰهَا', 'multiple_choice', 'Ash-Shams: 1', 'Ad-Duhaa: 1', 'Al-Lail: 1', 'Al-Fajr: 1', '1', 1],

  // SECTION 6: AYAT MUTASYABIHAT (12 questions)
  [6, 'Ayat Mutasyabihat', 1, 'فَأَلْقَىٰهَا ۖ وَإِذَا هِىَ حَيَّةٌ تَسْعَىٰ', 'multiple_choice', 'Al-Qasas: 28', 'An-Naml: 10', 'Taha: 20', "Ash-Shu'ara: 32", '1', 1],
  [6, 'Ayat Mutasyabihat', 2, 'قَالُوا۟ لَا تَخَفْ ۖ وَبَشَّرُوهُ بِغُلَٰمٍ عَلِيمٍ', 'multiple_choice', 'Adh-Dhariyat: 28', 'Al-Hijr: 53', 'As-Saffat: 101', 'Yusuf: 36', '1', 1],
  [6, 'Ayat Mutasyabihat', 3, 'فَنَادَىٰهُ مَلَائِكَةٌ وَهُوَ قَآئِمٌ يُصَلِّى فِى ٱلْمِحْرَابِ', 'multiple_choice', "Al 'Imran: 39", 'Maryam: 11', 'Al-Anbiya: 89', "Ash-Shu'ara: 69", '1', 1],
  [6, 'Ayat Mutasyabihat', 4, 'وَمَا كُنتَ لَدَيْهِمْ إِذْ يُلْقُونَ أَقْلَٰمَهُمْ أَيُّهُمْ يَكْفُلُ مَرْيَمَ', 'multiple_choice', "Al 'Imran: 44", 'Maryam: 28', 'Al-Anbiya: 30', 'As-Saffat: 113', '1', 1],
  [6, 'Ayat Mutasyabihat', 5, 'إِذْ قَالَتِ ٱلْمَلَٰٓئِكَةُ يَٰمَرْيَمُ إِنَّ ٱللَّهَ يُبَشِّرُكِ بِكَلِمَةٍ مِّنْهُ', 'multiple_choice', "Al 'Imran: 45", 'Maryam: 17', 'Al-Anbiya: 91', 'As-Saffat: 154', '1', 1],
  [6, 'Ayat Mutasyabihat', 6, 'قَالَتْ رَبِّ أَنَّىٰ يَكُونُ لِى وَلَدٌ وَلَمْ يَمْسَسْنِى بَشَرٌ', 'multiple_choice', "Al 'Imran: 47", 'Maryam: 20', 'Al-Anbiya: 30', 'As-Saffat: 152', '1', 1],
  [6, 'Ayat Mutasyabihat', 7, 'وَمَرْيَمَ ٱبْنَتَ عِمْرَٰنَ ٱلَّتِىٓ أَحْصَنَتْ فَرْجَهَا فَنَفَخْنَا فِيهِ مِن رُّوحِنَا', 'multiple_choice', 'At-Tahrim: 12', 'Al-Anbiya: 91', "Al-Mu'minun: 12", 'At-Tahrim: 10', '1', 1],
  [6, 'Ayat Mutasyabihat', 8, 'وَمَا كَانَ لِبَشَرٍ أَن يُكَلِّمَهُ ٱللَّهُ إِلَّا وَحْيًا أَوْ مِن وَرَآئِ حِجَابٍ', 'multiple_choice', 'Asy-Syura: 51', "Al-An'am: 103", "Al-A'raf: 143", 'An-Naml: 8', '1', 1],
  [6, 'Ayat Mutasyabihat', 9, 'هَٰٓأَنتُمْ هَٰٓؤُلَآءِ جَٰدَلْتُمْ عَمَّا لَكُم بِهِ عِلْمٌ فَلِمَ تُجَٰدِلُونَ فِيمَا لَيْسَ لَكُم بِهِ عِلْمٌ', 'multiple_choice', "Al 'Imran: 66", 'Al-Baqarah: 169', 'Al-Anbiya: 67', 'As-Saffat: 156', '1', 1],
  [6, 'Ayat Mutasyabihat', 10, 'سَيَقُولُ ٱلَّذِينَ أَشْرَكُوا۟ لَوْ شَآءَ ٱللَّهُ مَآ أَشْرَكْنَا وَلَآ ءَابَآؤُنَا', 'multiple_choice', "Al-An'am: 148", "Al-A'raf: 43", 'An-Nahl: 35', 'Al-Baqarah: 165', '1', 1],
  [6, 'Ayat Mutasyabihat', 11, 'وَمِنَ ٱلنَّاسِ وَٱلدَّوَآبِّ وَٱلْأَنْعَٰامِ مُخْتَلِفٌ أَلْوَٰنُهُۥ كَذَٰلِكَ', 'multiple_choice', 'Fatir: 28', 'Al-Anbiya: 30', 'Ar-Rum: 21', 'Al-Baqarah: 164', '1', 1],
  [6, 'Ayat Mutasyabihat', 12, 'وَإِذَا جَآءَكَ ٱلَّذِينَ يُؤْمِنُونَ بِـَٔايَٰتِنَا فَقُلْ سَلَٰمٌ عَلَيْكُمْ', 'multiple_choice', "Al-An'am: 54", "Al-A'raf: 46", 'Al-Hijr: 52', 'As-Saffat: 130', '1', 1],

  // SECTION 7: TEBAK HALAMAN (14 questions)
  [7, 'Tebak Halaman', 1, 'ٱلنَّجْمُ ٱلثَّاقِبُ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 2, 'وَٱلسَّمَآءِ وَٱلطَّارِقِ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 3, 'عَبَسَ وَتَوَلَّىٰٓ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 4, 'إِذَا ٱلسَّمَآءُ ٱنفَطَرَتْ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 5, 'وَٱلْمُرْسَلَٰتِ عُرْفًا', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 6, 'عَمَّ يَتَسَآءَلُونَ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 7, 'وَٱلنَّازِعَٰتِ غَرْقًا', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 8, 'إِذَا ٱلسَّمَآءُ ٱنفَطَرَتْ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 9, 'وَٱلسَّمَآءِ وَٱلطَّارِقِ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 10, 'سَبِّحِ ٱسْمَ رَبِّكَ ٱلْأَعْلَى', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 11, 'هَلْ أَتَىٰكَ حَدِيثُ ٱلْغَٰشِيَةِ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 12, 'وَٱلْفَجْرِ وَلَيَالٍ عَشْرٍ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 13, 'لَآ أُقْسِمُ بِهَٰذَا ٱلْبَلَدِ', 'multiple_choice', '589', '590', '591', '592', '1', 1],
  [7, 'Tebak Halaman', 14, 'وَٱلشَّمْسِ وَضُحَىٰهَا', 'multiple_choice', '589', '590', '591', '592', '1', 1],
];

// Create Excel data with header
const excelData = [
  ['Section', 'Section Title', 'Question Number', 'Question Text', 'Question Type',
   'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Correct Answer (1-4)', 'Points'],
  ...questions
];

// Create worksheet
const worksheet = xlsx.utils.aoa_to_sheet(excelData);

// Set column widths
worksheet['!cols'] = [
  { wch: 8 },   // Section
  { wch: 20 },  // Section Title
  { wch: 16 },  // Question Number
  { wch: 60 },  // Question Text
  { wch: 18 },  // Question Type
  { wch: 30 },  // Option 1
  { wch: 30 },  // Option 2
  { wch: 30 },  // Option 3
  { wch: 30 },  // Option 4
  { wch: 20 },  // Correct Answer
  { wch: 8 },   // Points
];

// Create workbook and add worksheet
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Juz 28 Questions');

// Write file
const filePath = 'D:\\tikrarmti.apps\\docs\\juz28_complete_questions.xlsx';
xlsx.writeFile(workbook, filePath);

console.log(`Excel file created: ${filePath}`);
console.log(`Total questions: ${questions.length}`);
console.log('\nBreakdown:');
console.log('- Section 2 (Tebak Nama Surat): 20 questions');
console.log('- Section 3 (Tebak Ayat): 5 questions');
console.log('- Section 4 (Sambung Surat): 3 questions');
console.log('- Section 5 (Tebak Awal Ayat): 5 questions');
console.log('- Section 6 (Ayat Mutasyabihat): 12 questions');
console.log('- Section 7 (Tebak Halaman): 14 questions');
console.log(`\nTotal: ${questions.length} questions`);
