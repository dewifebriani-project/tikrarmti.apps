-- Create juz_options table to store available juz choices
CREATE TABLE IF NOT EXISTS public.juz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  juz_number integer NOT NULL,
  part text NOT NULL, -- 'A' or 'B'
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  total_pages integer GENERATED ALWAYS AS (end_page - start_page + 1) STORED,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT juz_options_pkey PRIMARY KEY (id),
  CONSTRAINT juz_options_code_check CHECK (code ~ '^[0-9]+[AB]$'),
  CONSTRAINT juz_options_part_check CHECK (part IN ('A', 'B')),
  CONSTRAINT juz_options_pages_check CHECK (start_page <= end_page)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_juz_options_code ON public.juz_options USING btree (code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_juz_options_active ON public.juz_options USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_juz_options_sort_order ON public.juz_options USING btree (sort_order) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER handle_juz_options_updated_at
  BEFORE UPDATE ON juz_options
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Insert initial data for Tikrar MTI Batch 2
INSERT INTO public.juz_options (code, name, juz_number, part, start_page, end_page, sort_order) VALUES
  ('1A', 'Juz 1A (Halaman 1-11)', 1, 'A', 1, 11, 1),
  ('1B', 'Juz 1B (Halaman 12-21)', 1, 'B', 12, 21, 2),
  ('28A', 'Juz 28A (Halaman 542-551)', 28, 'A', 542, 551, 3),
  ('28B', 'Juz 28B (Halaman 552-561)', 28, 'B', 552, 561, 4),
  ('29A', 'Juz 29A (Halaman 562-571)', 29, 'A', 562, 571, 5),
  ('29B', 'Juz 29B (Halaman 572-581)', 29, 'B', 572, 581, 6),
  ('30A', 'Juz 30A (Halaman 582-591)', 30, 'A', 582, 591, 7),
  ('30B', 'Juz 30B (Halaman 592-604)', 30, 'B', 592, 604, 8)
ON CONFLICT (code) DO NOTHING;

-- Add comment to table
COMMENT ON TABLE public.juz_options IS 'Stores available juz options for Tikrar programs with page ranges';
COMMENT ON COLUMN public.juz_options.code IS 'Unique code like 1A, 1B, 28A, etc.';
COMMENT ON COLUMN public.juz_options.name IS 'Display name with page range';
COMMENT ON COLUMN public.juz_options.total_pages IS 'Auto-calculated total pages (end_page - start_page + 1)';
