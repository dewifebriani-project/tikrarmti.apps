-- Migration: Create juz_options table for Tikrah Tahfidz registration
-- Date: 2025-12-23
-- Description: Create table for juz options that can be selected during registration

-- Create juz_options table
CREATE TABLE IF NOT EXISTS public.juz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[0-9]+[AB]$'::text),
  name text NOT NULL,
  juz_number integer NOT NULL,
  part text NOT NULL CHECK (part = ANY (ARRAY['A'::text, 'B'::text])),
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  total_pages integer DEFAULT ((end_page - start_page) + 1),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT juz_options_pkey PRIMARY KEY (id)
);

-- Add comments for documentation
COMMENT ON TABLE public.juz_options IS 'Pilihan juz untuk pendaftaran Tikrah Tahfidz. Setiap juz dibagi menjadi bagian A (1/2 pertama) dan B (1/2 kedua)';
COMMENT ON COLUMN public.juz_options.code IS 'Kode unik untuk juz option, format: {juz_number}{part}, contoh: 1A, 1B, 30A, 30B';
COMMENT ON COLUMN public.juz_options.name IS 'Nama yang ditampilkan untuk pilihan juz';
COMMENT ON COLUMN public.juz_options.juz_number IS 'Nomor juz (1-30)';
COMMENT ON COLUMN public.juz_options.part IS 'Bagian juz: A (setengah pertama) atau B (setengah kedua)';
COMMENT ON COLUMN public.juz_options.start_page IS 'Nomor halaman awal sesuai standar Kemenag';
COMMENT ON COLUMN public.juz_options.end_page IS 'Nomor halaman akhir sesuai standar Kemenag';
COMMENT ON COLUMN public.juz_options.total_pages IS 'Total halaman untuk bagian ini';
COMMENT ON COLUMN public.juz_options.is_active IS 'Status aktif/non-aktif untuk pilihan juz';
COMMENT ON COLUMN public.juz_options.sort_order IS 'Urutan tampilan di form pendaftaran';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_juz_options_active ON public.juz_options(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_juz_options_sort ON public.juz_options(sort_order ASC);

-- Enable Row Level Security
ALTER TABLE public.juz_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - everyone can read active juz options
CREATE POLICY "Active juz options are viewable by everyone"
  ON public.juz_options
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete juz options
CREATE POLICY "Only admins can insert juz options"
  ON public.juz_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update juz options"
  ON public.juz_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete juz options"
  ON public.juz_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert juz options for Batch 2 (Juz 1, 28, 29, 30)
-- Juz 1 (Al-Fatihah - Al-Baqarah)
-- Bagian A: Al-Fatihah - Al-Baqarah 1-100 (halaman 1-101)
-- Bagian B: Al-Baqarah 101-end (halaman 102-202)
INSERT INTO public.juz_options (code, name, juz_number, part, start_page, end_page, sort_order, is_active)
VALUES
  ('1A', 'Juz 1A - Al-Fatihah s/d Al-Baqarah 100', 1, 'A', 1, 101, 1, true),
  ('1B', 'Juz 1B - Al-Baqarah 101 s/d Akhir', 1, 'B', 102, 202, 2, true)
ON CONFLICT (code) DO NOTHING;

-- Juz 28 (An-Naba - Al-Mutaffifin)
-- Bagian A: An-Naba - Abasa (halaman 582-592)
-- Bagian B: At-Takwir - Al-Mutaffifin (halaman 593-604)
INSERT INTO public.juz_options (code, name, juz_number, part, start_page, end_page, sort_order, is_active)
VALUES
  ('28A', 'Juz 28A - An-Naba s/d Abasa', 28, 'A', 582, 592, 3, true),
  ('28B', 'Juz 28B - At-Takwir s/d Al-Mutaffifin', 28, 'B', 593, 604, 4, true)
ON CONFLICT (code) DO NOTHING;

-- Juz 29 (Al-Mulk - An-Naba)
-- Bagian A: Al-Mulk - Al-Jinn (halaman 562-573)
-- Bagian B: Al-Muzzammil - An-Naba (halaman 574-581)
INSERT INTO public.juz_options (code, name, juz_number, part, start_page, end_page, sort_order, is_active)
VALUES
  ('29A', 'Juz 29A - Al-Mulk s/d Al-Jinn', 29, 'A', 562, 573, 5, true),
  ('29B', 'Juz 29B - Al-Muzzammil s/d An-Naba (sebelum An-Naba)', 29, 'B', 574, 581, 6, true)
ON CONFLICT (code) DO NOTHING;

-- Juz 30 (An-Naba - An-Nas)
-- Bagian A: An-Naba - Al-Buruj (halaman 582-591, ditinjau ulang untuk juz 30 saja)
-- Bagian B: At-Tariq - An-Nas (halaman 592-604)
-- Note: Juz 30 starts at page 582 with An-Naba
INSERT INTO public.juz_options (code, name, juz_number, part, start_page, end_page, sort_order, is_active)
VALUES
  ('30A', 'Juz 30A - An-Naba s/d Al-Buruj', 30, 'A', 582, 591, 7, true),
  ('30B', 'Juz 30B - At-Tariq s/d An-Nas', 30, 'B', 592, 604, 8, true)
ON CONFLICT (code) DO NOTHING;

-- Verify the inserted data
SELECT
    id,
    code,
    name,
    juz_number,
    part,
    start_page,
    end_page,
    total_pages,
    is_active,
    sort_order
FROM public.juz_options
ORDER BY sort_order;
