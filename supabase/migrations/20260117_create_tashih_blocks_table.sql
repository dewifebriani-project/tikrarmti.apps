-- Migration: Create tashih_blocks table
-- Description: Table to manage tashih blocks linked to juz codes and week numbers
-- Block naming pattern: H[week_number][part] (e.g., H1A, H1B, H1C, H1D for week 1)
-- For juz part A: starts from H1A (week 1)
-- For juz part B: starts from H11A (week 11, assuming 10 weeks for part A)

-- Create tashih_blocks table
CREATE TABLE IF NOT EXISTS public.tashih_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  juz_code text NOT NULL, -- References juz_options.code (e.g., '30A', '30B')
  week_number integer NOT NULL, -- Week number from batch start_date
  block_code text NOT NULL, -- Generated block code (e.g., 'H1A', 'H11B')
  part text NOT NULL CHECK (part = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])), -- A, B, C, D for the 4 blocks in a week
  start_page integer NOT NULL,
  end_page integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tashih_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT tashih_blocks_block_code_key UNIQUE (block_code)
);

-- Add comments for documentation
COMMENT ON TABLE public.tashih_blocks IS 'Tashih blocks for tracking hafalan progress. Blocks are generated per week based on juz code (A or B part).';
COMMENT ON COLUMN public.tashih_blocks.juz_code IS 'References juz_options.code (e.g., 30A, 30B)';
COMMENT ON COLUMN public.tashih_blocks.week_number IS 'Week number from batch start_date (1-based)';
COMMENT ON COLUMN public.tashih_blocks.block_code IS 'Block identifier like H1A, H1B, H11A. H = Halaman, number = week, letter = part (A/B/C/D)';
COMMENT ON COLUMN public.tashih_blocks.part IS 'Part within the week: A, B, C, or D (4 blocks per week)';
COMMENT ON COLUMN public.tashih_blocks.start_page IS 'Starting page number for this block';
COMMENT ON COLUMN public.tashih_blocks.end_page IS 'Ending page number for this block';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tashih_blocks_juz_code ON public.tashih_blocks(juz_code);
CREATE INDEX IF NOT EXISTS idx_tashih_blocks_week_number ON public.tashih_blocks(week_number);
CREATE INDEX IF NOT EXISTS idx_tashih_blocks_block_code ON public.tashih_blocks(block_code);
CREATE INDEX IF NOT EXISTS idx_tashih_blocks_active ON public.tashih_blocks(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.tashih_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Everyone can read active tashih blocks
CREATE POLICY "Active tashih blocks are viewable by everyone"
  ON public.tashih_blocks
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete tashih blocks
CREATE POLICY "Only admins can insert tashih blocks"
  ON public.tashih_blocks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

CREATE POLICY "Only admins can update tashih blocks"
  ON public.tashih_blocks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

CREATE POLICY "Only admins can delete tashih blocks"
  ON public.tashih_blocks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Function to generate blocks for a juz code
-- This function calculates which blocks to show based on the current week
CREATE OR REPLACE FUNCTION public.get_tashih_blocks_for_juz(
  p_juz_code text,
  p_batch_start_date date,
  p_current_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  block_code text,
  week_number integer,
  part text,
  start_page integer,
  end_page integer
) AS $$
DECLARE
  v_juz_record RECORD;
  v_weeks_since_start integer;
  v_part_offset integer; -- 0 for part A, 10 for part B (assuming 10 weeks per part)
  v_current_week integer;
  v_pages_per_part integer;
  v_pages_per_block numeric;
BEGIN
  -- Get juz info
  SELECT * INTO v_juz_record
  FROM public.juz_options
  WHERE code = p_juz_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate total pages for this juz part
  v_pages_per_part := v_juz_record.end_page - v_juz_record.start_page + 1;

  -- Determine part offset (part A starts at week 1, part B starts at week 11)
  v_part_offset := CASE
    WHEN v_juz_record.part = 'A' THEN 0
    WHEN v_juz_record.part = 'B' THEN 10  -- Assuming 10 weeks for part A
    ELSE 0
  END;

  -- Calculate weeks since batch start
  v_weeks_since_start := FLOOR(DATE_PART('day', p_current_date - p_batch_start_date) / 7);

  -- Current week for this user (1-based, plus part offset)
  v_current_week := v_weeks_since_start + v_part_offset + 1;

  -- Calculate pages per block (4 blocks per week)
  -- Total pages divided by (total weeks * 4 blocks per week)
  v_pages_per_block := v_pages_per_part::numeric / (10 * 4); -- 10 weeks per part

  -- Return blocks for the current week only
  RETURN QUERY
  SELECT
    'H' || v_current_week || part AS block_code,
    v_current_week AS week_number,
    part,
    -- Calculate page range for this block
    -- Formula: start_page + (current_week - part_offset - 1) * 4_blocks * pages_per_block + (part_index * pages_per_block)
    v_juz_record.start_page + FLOOR((v_current_week - v_part_offset - 1) * 4 * v_pages_per_block) +
      CASE
        WHEN part = 'A' THEN 0
        WHEN part = 'B' THEN FLOOR(v_pages_per_block)
        WHEN part = 'C' THEN FLOOR(v_pages_per_block * 2)
        WHEN part = 'D' THEN FLOOR(v_pages_per_block * 3)
      END::integer AS start_page,
    v_juz_record.start_page + FLOOR((v_current_week - v_part_offset - 1) * 4 * v_pages_per_block) +
      CASE
        WHEN part = 'A' THEN FLOOR(v_pages_per_block) - 1
        WHEN part = 'B' THEN FLOOR(v_pages_per_block * 2) - 1
        WHEN part = 'C' THEN FLOOR(v_pages_per_block * 3) - 1
        WHEN part = 'D' THEN FLOOR(v_pages_per_block * 4) - 1
      END::integer AS end_page
  FROM (SELECT 'A'::text AS part UNION ALL SELECT 'B' UNION ALL SELECT 'C' UNION ALL SELECT 'D') AS parts
  ORDER BY part;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_tashih_blocks_for_juz IS 'Returns the 4 blocks (H1A, H1B, H1C, H1D) for the current week based on juz code and batch start date';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_tashih_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tashih_blocks_updated_at
  BEFORE UPDATE ON public.tashih_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tashih_blocks_updated_at();

-- Verify function works (example usage)
-- SELECT * FROM public.get_tashih_blocks_for_juz('30A', '2025-01-01', CURRENT_DATE);
