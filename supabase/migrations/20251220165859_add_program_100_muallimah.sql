-- Insert Program 100 Muallimah
-- This will be linked to an existing active batch

-- First, let's get the current active batch (assuming there's one)
-- We'll use the most recent batch with 'open' or 'ongoing' status

-- Program 100 Muallimah
INSERT INTO public.programs (
  id,
  batch_id,
  name,
  description,
  target_level,
  duration_weeks,
  max_thalibah,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  b.id,
  'Program 100 Muallimah',
  'Program pembinaan guru Al-Quran profesional untuk menghasilkan 100 muallimah berkualitas yang siap mengajar di MTI dan lembaga tahfidz lainnya',
  'Guru Profesional',
  24, -- 6 bulan = 24 minggu
  100, -- target 100 muallimah
  'open',
  NOW(),
  NOW()
FROM batches b
WHERE b.status = 'open'
ORDER BY b.created_at DESC
LIMIT 1;

-- Insert Program Perekrutan Musyrifah
INSERT INTO public.programs (
  id,
  batch_id,
  name,
  description,
  target_level,
  duration_weeks,
  max_thalibah,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  b.id,
  'Perekrutan Musyrifah',
  'Program rekrutmen dan pembinaan musyrifah untuk membantu muallimah dalam melaksanakan tugas pembinaan dan pengawasan thalibah',
  'Pembimbing',
  12, -- 3 bulan = 12 minggu
  30, -- target 30 musyrifah
  'open',
  NOW(),
  NOW()
FROM batches b
WHERE b.status = 'open'
ORDER BY b.created_at DESC
LIMIT 1;