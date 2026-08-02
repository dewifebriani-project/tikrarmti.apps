-- Kuota halaqah mengikuti akad Muallimah dan tetap dapat diedit oleh admin.
-- Nilai 5 hanya digunakan sebagai default jika kuota tidak diberikan.
ALTER TABLE public.halaqah
  ALTER COLUMN max_students SET DEFAULT 5;
