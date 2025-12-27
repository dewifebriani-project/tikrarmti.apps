# Exam Questions Seed Data Instructions

## Overview
This document provides instructions for importing exam questions for Juz 28, 29, and 30 into the database.

## Database Tables
- `exam_questions` - Stores all exam questions
- `exam_attempts` - Stores user exam attempts
- `exam_question_flags` - Stores user-reported question issues

## Question Structure

### Sections for Each Juz
1. **Section 1**: Ketentuan Ikhtibar (Introduction - checkbox agreement)
2. **Section 2**: Tebak Nama Surat (Guess the Surah name)
3. **Section 3**: Tebak Ayat (Guess the verse)
4. **Section 4**: Sambung Surat (Continue the Surah)
5. **Section 5**: Tebak Awal Ayat (Guess the beginning of verse)
6. **Section 6**: Ayat Mutasyabihat (Similar verses)
7. **Section 7**: Pengenalan Surat (Surah recognition)
8. **Section 8**: Tebak Halaman (Guess the page)

## Juz-Specific Details

### Juz 30
- Total Questions: 100
- Surahs: An-Naba' to An-Naas
- Sections: 9 (includes "Urutan Surat" section)

### Juz 29
- Total Questions: 100
- Surahs: Al-Mulk to Al-Mursalat
- Sections: 9

### Juz 28
- Total Questions: 100
- Surahs: Al-Mujadalah to At-Tahrim
- Sections: 8 (no "Urutan Surat" section)

## Data Format

Each question in the `exam_questions` table follows this structure:

```json
{
  "juz_number": 28 | 29 | 30,
  "section_number": 1-9,
  "section_title": "Tebak Nama Surat",
  "question_number": 1-N,
  "question_text": "ٱلنَّجْمُ ٱلثَّاقِبُ\nAyat ini terletak pada surat",
  "question_type": "multiple_choice" | "introduction",
  "options": [
    {"text": "Ath-Thariq", "isCorrect": true},
    {"text": "Al-Ghasiyah", "isCorrect": false},
    ...
  ],
  "correct_answer": "Ath-Thariq",
  "points": 1,
  "is_active": true
}
```

## Import Process

### Step 1: Run Database Migration
Execute `exam_system_migration.sql` in Supabase SQL Editor

### Step 2: Import Seed Data
Execute the seed SQL scripts:
- `exam_seed_juz30.sql`
- `exam_seed_juz29.sql`
- `exam_seed_juz28.sql`

### Step 3: Verify Data
Run verification queries to ensure:
- All 300 questions imported correctly
- Correct answer keys are set
- All sections have proper question counts

## Notes

- Section 1 (Ketentuan Ikhtibar) only has 1 question (agreement checkbox)
- All other sections have varying numbers of questions
- Arabic text must be preserved exactly as provided
- Option order must match the original Google Forms
- Correct answers are indicated in the source data

## Verification Queries

```sql
-- Count total questions per juz
SELECT juz_number, COUNT(*) as total_questions
FROM exam_questions
GROUP BY juz_number;

-- Count questions per section
SELECT juz_number, section_number, section_title, COUNT(*) as question_count
FROM exam_questions
GROUP BY juz_number, section_number, section_title
ORDER BY juz_number, section_number;

-- Verify all questions have correct answers
SELECT juz_number, COUNT(*) as questions_with_no_answer
FROM exam_questions
WHERE correct_answer IS NULL OR correct_answer = ''
GROUP BY juz_number;
```

## Maintenance

Admin can manage questions through the admin panel:
- Add/Edit/Delete questions
- Change correct answers
- Activate/Deactivate questions
- View and respond to question flags from users
