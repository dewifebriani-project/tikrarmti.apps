-- Migration to fix muallimah_registrations schema
-- Make legacy columns nullable to prevent upsert failures for new users

ALTER TABLE public.muallimah_registrations 
  ALTER COLUMN birth_date DROP NOT NULL,
  ALTER COLUMN birth_place DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN education DROP NOT NULL,
  ALTER COLUMN memorization_level DROP NOT NULL,
  ALTER COLUMN preferred_juz DROP NOT NULL,
  ALTER COLUMN teaching_experience DROP NOT NULL,
  ALTER COLUMN preferred_schedule DROP NOT NULL,
  ALTER COLUMN backup_schedule DROP NOT NULL;

-- Ensure batch_id is also nullable as per previous migrations but reinforced here
ALTER TABLE public.muallimah_registrations 
  ALTER COLUMN batch_id DROP NOT NULL;
