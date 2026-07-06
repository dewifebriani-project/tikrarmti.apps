-- Add pengabdian and donasi columns
ALTER TABLE public.daftar_ulang_submissions 
ADD COLUMN IF NOT EXISTS pengabdian_choice character varying(50),
ADD COLUMN IF NOT EXISTS donasi_amount numeric;

-- Insert dynamic form settings into reregistration_questions
-- We'll add them to section 4 (since section 1 is Data Diri, 2 is Jadwal, 3 is Partner)
-- Let's put them in section 4.
INSERT INTO public.reregistration_questions (field_key, section, label, description, warning_text, is_active, is_required, sort_order, input_type, options)
VALUES 
  ('pengabdian_choice', 4, 'Pilihan Pengabdian', 'Apakah Anda bersedia berkhidmat/mengabdi untuk program Tikrar Tahfidz?', NULL, true, true, 10, 'radio_options', '["Muallimah", "Musyrifah", "Admin", "Donatur", "Tidak untuk saat ini"]'::jsonb),
  ('donasi_amount', 4, 'Komitmen Infaq / Donasi', 'Silakan pilih atau masukkan nominal komitmen infaq/donasi Anda.', NULL, true, false, 20, 'radio_options', '["Rp 25.000", "Rp 50.000", "Rp 75.000", "Rp 100.000", "Lainnya"]'::jsonb)
ON CONFLICT (field_key) DO UPDATE SET 
  section = EXCLUDED.section,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  input_type = EXCLUDED.input_type,
  options = EXCLUDED.options;
