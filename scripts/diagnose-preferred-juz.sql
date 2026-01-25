-- Simple test to diagnose the issue with analyze_halaqah_availability_by_juz
-- Run this in Supabase SQL Editor

-- First, check if halaqah table has preferred_juz column and its data
SELECT
  h.id,
  h.name,
  h.preferred_juz,
  h.program_id,
  p.name as program_name,
  p.batch_id
FROM halaqah h
INNER JOIN programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active'
LIMIT 10;

-- Check if preferred_juz has data
SELECT
  COUNT(*) as total_halaqah,
  COUNT(preferred_juz) as halaqah_with_preferred_juz,
  COUNT(*) - COUNT(preferred_juz) as halaqah_without_preferred_juz
FROM halaqah h
INNER JOIN programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active';

-- Check what values are in preferred_juz
SELECT DISTINCT
  preferred_juz,
  COUNT(*) as count
FROM halaqah h
INNER JOIN programs p ON p.id = h.program_id
WHERE p.batch_id = '4bcb3020-20cb-46e2-8be4-0100f8012a49'::UUID
  AND h.status = 'active'
  AND preferred_juz IS NOT NULL
GROUP BY preferred_juz;
