-- ============================================
-- Seed Exam Questions for Juz 29 and Juz 30
-- Sample questions for testing the exam system
-- ============================================

-- Sample Questions for Juz 29 (for those who chose 28A or 28B)
INSERT INTO public.exam_questions (juz_number, juz_code, section_number, section_title, question_number, question_text, question_type, options, correct_answer, points, is_active, created_by) VALUES
-- Section 1: Tebak Nama Surat
(29, '29A', 1, 'Tebak Nama Surat', 1, 'سُورَةٌ تَتَحَدَّثُ عَنِ الْمُرْسَلِينَ وَقِصَّتِهِم مَّعَ قَوْمِهِم', 'multiple_choice', '[{"text": "سُورَةُ الْأَنْبِيَاءِ", "isCorrect": true}, {"text": "سُورَةُ الْمُمْتَحَنَةِ", "isCorrect": false}, {"text": "سُورَةُ الشُّعَرَاءِ", "isCorrect": false}, {"text": "سُورَةُ النَّمْلِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْأَنْبِيَاءِ', 1, true, NULL::uuid),
(29, '29A', 1, 'Tebak Nama Surat', 2, 'تِلْكَ آيَاتُ الْقُرْآنِ وَكِتَابٍ مُّبِينٍ هُدًى وَبُشْرَى لِلْمُؤْمِنِينَ', 'multiple_choice', '[{"text": "سُورَةُ الْقَصَصِ", "isCorrect": false}, {"text": "سُورَةُ النَّمْلِ", "isCorrect": true}, {"text": "سُورَةُ الْقَمَرِ", "isCorrect": false}, {"text": "سُورَةُ الرَّحْمَٰنِ", "isCorrect": false}]'::jsonb, 'سُورَةُ النَّمْلِ', 1, true, NULL::uuid),

-- Section 2: Tebak Ayat
(29, '29A', 2, 'Tebak Ayat', 1, 'وَاتْلُ عَلَيْهِمْ نَبَأَ إِبْرَاهِيمَ', 'multiple_choice', '[{"text": "سُورَةُ الشُّعَرَاءِ", "isCorrect": false}, {"text": "سُورَةُ الْأَنْبِيَاءِ", "isCorrect": true}, {"text": "سُورَةُ الْعَنْكَبُوتِ", "isCorrect": false}, {"text": "سُورَةُ الرُّومِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْأَنْبِيَاءِ', 1, true, NULL::uuid),
(29, '29A', 2, 'Tebak Ayat', 2, 'الم * ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', 'multiple_choice', '[{"text": "سُورَةُ الْبَقَرَةِ", "isCorrect": true}, {"text": "سُورَةُ آلِ عِمْرَانَ", "isCorrect": false}, {"text": "سُورَةُ الْقَصَصِ", "isCorrect": false}, {"text": "سُورَةُ الْأَنْعَامِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْبَقَرَةِ', 1, true, NULL::uuid),

-- Section 3: Sambung Surat
(29, '29A', 3, 'Sambung Surat', 1, 'تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ عَلَىٰ عَبْدِهِ لِيَكُونَ لِلْعَالَمِينَ نَذِيرًا', 'multiple_choice', '[{"text": "الَّذِي لَهُ مُلْكُ السَّمَاوَاتِ وَالْأَرْضِ", "isCorrect": true}, {"text": "الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ", "isCorrect": false}, {"text": "الَّذِي أَنزَلَ الْكِتَابَ", "isCorrect": false}, {"text": "رَبُّ الْعَرْشِ الْكَرِيمِ", "isCorrect": false}]'::jsonb, 'الَّذِي لَهُ مُلْكُ السَّمَاوَاتِ وَالْأَرْضِ', 1, true, NULL::uuid),

-- Section 4: Tebak Awal Ayat
(29, '29A', 4, 'Tebak Awal Ayat', 1, 'الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ وَجَعَلَ الظُّلُمَاتِ وَالنُّورَ', 'multiple_choice', '[{"text": "سُورَةُ الْأَنْعَامِ", "isCorrect": true}, {"text": "سُورَةُ الْأَحْزَابِ", "isCorrect": false}, {"text": "سُورَةُ فَاطِرٍ", "isCorrect": false}, {"text": "سُورَةُ السَّجْدَةِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْأَنْعَامِ', 1, true, NULL::uuid),

-- Section 5: Ayat Mutasyabihat
(29, '29A', 5, 'Ayat Mutasyabihat', 1, 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ', 'multiple_choice', '[{"text": "سُورَةُ الرُّومِ", "isCorrect": false}, {"text": "سُورَةُ النُّورِ", "isCorrect": true}, {"text": "سُورَةُ الْأَنْعَامِ", "isCorrect": false}, {"text": "سُورَةُ الْمُؤْمِنُونَ", "isCorrect": false}]'::jsonb, 'سُورَةُ النُّورِ', 1, true, NULL::uuid),

-- General knowledge questions about Juz 29
(29, '29A', 8, 'Lainnya', 1, 'Berapa jumlah surah dalam Juz 29?', 'multiple_choice', '[{"text": "7 surah", "isCorrect": false}, {"text": "9 surah", "isCorrect": true}, {"text": "11 surah", "isCorrect": false}, {"text": "13 surah", "isCorrect": false}]'::jsonb, '9 surah', 1, true, NULL::uuid),
(29, '29A', 8, 'Lainnya', 2, 'Surah apa yang menjadi pembuka Juz 29?', 'multiple_choice', '[{"text": "سُورَةُ الْعَنْكَبُوتِ", "isCorrect": false}, {"text": "سُورَةُ الشُّعَرَاءِ", "isCorrect": false}, {"text": "سُورَةُ طٰهٰ", "isCorrect": false}, {"text": "سُورَةُ الْمُلْكِ", "isCorrect": true}]'::jsonb, 'سُورَةُ الْمُلْكِ', 1, true, NULL::uuid),

-- More questions for testing
(29, '29A', 1, 'Tebak Nama Surat', 3, 'وَالصَّافَّاتِ صَفًّا * فَالزَّاجِرَاتِ زَجْرًا', 'multiple_choice', '[{"text": "سُورَةُ الصَّافَّاتِ", "isCorrect": true}, {"text": "سُورَةُ النَّازِعَاتِ", "isCorrect": false}, {"text": "سُورَةُ الْمُطَفِّفِينَ", "isCorrect": false}, {"text": "سُورَةُ الْمُرْسَلَاتِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الصَّافَّاتِ', 1, true, NULL::uuid),
(29, '29A', 1, 'Tebak Nama Surat', 4, 'يَا أَيُّهَا الْمُزَّمِّلُ * قُمِ اللَّيْلَ إِلَّا قَلِيلًا', 'multiple_choice', '[{"text": "سُورَةُ الْمُزَّمِّلِ", "isCorrect": true}, {"text": "سُورَةُ الْمُدَّثِّرِ", "isCorrect": false}, {"text": "سُورَةُ الْإِنْسَانِ", "isCorrect": false}, {"text": "سُورَةُ الْمُرْسَلَاتِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْمُزَّمِّلِ', 1, true, NULL::uuid);

-- Sample Questions for Juz 30 (for those who chose 29A/29B or 1A/1B)
INSERT INTO public.exam_questions (juz_number, juz_code, section_number, section_title, question_number, question_text, question_type, options, correct_answer, points, is_active, created_by) VALUES
-- Section 1: Tebak Nama Surat
(30, '30A', 1, 'Tebak Nama Surat', 1, 'إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا', 'multiple_choice', '[{"text": "سُورَةُ الزَّلْزَلَةِ", "isCorrect": true}, {"text": "سُورَةُ الْعَادِيَاتِ", "isCorrect": false}, {"text": "سُورَةُ الْقَارِعَةِ", "isCorrect": false}, {"text": "سُورَةُ التَّكَاثُرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الزَّلْزَلَةِ', 1, true, NULL::uuid),
(30, '30A', 1, 'Tebak Nama Surat', 2, 'وَالْعَادِيَاتِ ضَبْحًا', 'multiple_choice', '[{"text": "سُورَةُ الزَّلْزَلَةِ", "isCorrect": false}, {"text": "سُورَةُ الْعَادِيَاتِ", "isCorrect": true}, {"text": "سُورَةُ الْقَارِعَةِ", "isCorrect": false}, {"text": "سُورَةُ التَّكَاثُرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْعَادِيَاتِ', 1, true, NULL::uuid),
(30, '30A', 1, 'Tebak Nama Surat', 3, 'أَلْهَاكُمُ التَّكَاثُرُ', 'multiple_choice', '[{"text": "سُورَةُ الزَّلْزَلَةِ", "isCorrect": false}, {"text": "سُورَةُ الْعَادِيَاتِ", "isCorrect": false}, {"text": "سُورَةُ التَّكَاثُرِ", "isCorrect": true}, {"text": "سُورَةُ الْعَصْرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ التَّكَاثُرِ', 1, true, NULL::uuid),
(30, '30A', 1, 'Tebak Nama Surat', 4, 'وَالْعَصْرِ * إِنَّ الْإِنسَانَ لَفِي خُسْرٍ', 'multiple_choice', '[{"text": "سُورَةُ الزَّلْزَلَةِ", "isCorrect": false}, {"text": "سُورَةُ الْعَادِيَاتِ", "isCorrect": false}, {"text": "سُورَةُ التَّكَاثُرِ", "isCorrect": false}, {"text": "سُورَةُ الْعَصْرِ", "isCorrect": true}]'::jsonb, 'سُورَةُ الْعَصْرِ', 1, true, NULL::uuid),

-- Section 2: Tebak Ayat
(30, '30A', 2, 'Tebak Ayat', 1, 'قُلْ هُوَ اللَّهُ أَحَدٌ * اللَّهُ الصَّمَدُ', 'multiple_choice', '[{"text": "سُورَةُ الْإِخْلَاصِ", "isCorrect": true}, {"text": "سُورَةُ الْفَلَقِ", "isCorrect": false}, {"text": "سُورَةُ النَّاسِ", "isCorrect": false}, {"text": "سُورَةُ الْكَوْثَرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْإِخْلَاصِ', 1, true, NULL::uuid),
(30, '30A', 2, 'Tebak Ayat', 2, 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', 'multiple_choice', '[{"text": "سُورَةُ الْإِخْلَاصِ", "isCorrect": false}, {"text": "سُورَةُ الْفَلَقِ", "isCorrect": true}, {"text": "سُورَةُ النَّاسِ", "isCorrect": false}, {"text": "سُورَةُ الْكَوْثَرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْفَلَقِ', 1, true, NULL::uuid),
(30, '30A', 2, 'Tebak Ayat', 3, 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'multiple_choice', '[{"text": "سُورَةُ الْإِخْلَاصِ", "isCorrect": false}, {"text": "سُورَةُ الْفَلَقِ", "isCorrect": false}, {"text": "سُورَةُ النَّاسِ", "isCorrect": true}, {"text": "سُورَةُ الْكَوْثَرِ", "isCorrect": false}]'::jsonb, 'سُورَةُ النَّاسِ', 1, true, NULL::uuid),

-- Section 3: Sambung Surat
(30, '30A', 3, 'Sambung Surat', 1, 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'multiple_choice', '[{"text": "فَصَلِّ لِرَبِّكَ وَانْحَرْ", "isCorrect": true}, {"text": "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", "isCorrect": false}, {"text": "فَسَبِّحْ بِاسْمِ رَبِّكَ الْعَظِيمِ", "isCorrect": false}, {"text": "وَاللَّيْلِ إِذَا يَغْشَىٰ", "isCorrect": false}]'::jsonb, 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', 1, true, NULL::uuid),

-- Section 5: Ayat Mutasyabihat
(30, '30A', 5, 'Ayat Mutasyabihat', 1, 'الْكَوْثَرُ', 'multiple_choice', '[{"text": "نَهْرٌ فِي الْجَنَّةِ", "isCorrect": true}, {"text": "جَبَلٌ فِي الْجَنَّةِ", "isCorrect": false}, {"text": "شَجَرَةٌ فِي الْجَنَّةِ", "isCorrect": false}, {"text": "قَصْرٌ فِي الْجَنَّةِ", "isCorrect": false}]'::jsonb, 'نَهْرٌ فِي الْجَنَّةِ', 1, true, NULL::uuid),

-- General knowledge questions
(30, '30A', 8, 'Lainnya', 1, 'Berapa jumlah surah dalam Juz 30 (Juz Amma)?', 'multiple_choice', '[{"text": "30 surah", "isCorrect": false}, {"text": "37 surah", "isCorrect": true}, {"text": "40 surah", "isCorrect": false}, {"text": "45 surah", "isCorrect": false}]'::jsonb, '37 surah', 1, true, NULL::uuid),
(30, '30A', 8, 'Lainnya', 2, 'Surah terpendek dalam Al-Qur\'an adalah:', 'multiple_choice', '[{"text": "سُورَةُ الْكَوْثَرِ", "isCorrect": true}, {"text": "سُورَةُ الْعَصْرِ", "isCorrect": false}, {"text": "سُورَةُ النَّاسِ", "isCorrect": false}, {"text": "سُورَةُ الْفَلَقِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْكَوْثَرِ', 1, true, NULL::uuid),
(30, '30A', 8, 'Lainnya', 3, 'Surah apa yang disebut dengan "Ummul Quran"?', 'multiple_choice', '[{"text": "سُورَةُ الْفَاتِحَةِ", "isCorrect": true}, {"text": "سُورَةُ الْبَقَرَةِ", "isCorrect": false}, {"text": "سُورَةُ يَسَ", "isCorrect": false}, {"text": "سُورَةُ الْكَهْفِ", "isCorrect": false}]'::jsonb, 'سُورَةُ الْفَاتِحَةِ', 1, true, NULL::uuid),
(30, '30A', 8, 'Lainnya', 4, 'Ayat terakhir yang diturunkan adalah:', 'multiple_choice', '[{"text": "آيَةُ الرِّبَا", "isCorrect": false}, {"text": "آيَةُ الْكَالَةِ", "isCorrect": true}, {"text": "آيَةُ السَّيْفِ", "isCorrect": false}, {"text": "آيَةُ الْوُضُوءِ", "isCorrect": false}]'::jsonb, 'آيَةُ الْكَالَةِ', 1, true, NULL::uuid);

ON CONFLICT DO NOTHING;
