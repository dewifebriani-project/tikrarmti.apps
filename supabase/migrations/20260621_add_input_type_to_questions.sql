-- Migration: Add input_type column to all registration question tables
-- Date: 2026-06-21
-- Description: Adds input_type so admin preview renders the exact same control as the public form.
-- Valid values: 'radio', 'radio_options', 'text', 'textarea', 'select', 'checkbox', 'multi_select', 'file', 'number', 'time', 'button_select', 'info'

-- ═══════════════════════════════════════════════════════════════
-- 1) registration_questions (Tikrar Tahfidz)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.registration_questions
  ADD COLUMN IF NOT EXISTS input_type text NOT NULL DEFAULT 'text';

-- Boolean radio (single "Yes" option)
UPDATE public.registration_questions SET input_type = 'radio' WHERE field_key IN (
  'understands_commitment', 'tried_simulation', 'no_negotiation',
  'has_telegram', 'saved_contact', 'no_travel_plans'
);
-- Checkbox (single standalone checkbox)
UPDATE public.registration_questions SET input_type = 'checkbox' WHERE field_key IN (
  'time_commitment', 'understands_program'
);
-- Radio with multiple named options from options jsonb
UPDATE public.registration_questions SET input_type = 'radio_options' WHERE field_key IN (
  'has_permission', 'ready_for_team'
);
-- Select dropdown
UPDATE public.registration_questions SET input_type = 'select' WHERE field_key IN (
  'chosen_juz', 'main_time_slot', 'backup_time_slot'
);
-- Textarea
UPDATE public.registration_questions SET input_type = 'textarea' WHERE field_key IN (
  'motivation', 'questions'
);
-- Text input (default, explicit)
UPDATE public.registration_questions SET input_type = 'text' WHERE field_key IN (
  'permission_name', 'permission_phone'
);
-- Info / instruction
UPDATE public.registration_questions SET input_type = 'info' WHERE field_key = 'commitment_info';


-- ═══════════════════════════════════════════════════════════════
-- 2) reregistration_questions (Daftar Ulang)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.reregistration_questions
  ADD COLUMN IF NOT EXISTS input_type text NOT NULL DEFAULT 'text';

-- Text input
UPDATE public.reregistration_questions SET input_type = 'text' WHERE field_key IN (
  'confirmed_full_name', 'confirmed_wa_phone'
);
-- Textarea
UPDATE public.reregistration_questions SET input_type = 'textarea' WHERE field_key IN (
  'confirmed_address'
);
-- Info / instruction (display only, not an input)
UPDATE public.reregistration_questions SET input_type = 'info' WHERE field_key IN (
  'schedule_instructions'
);
-- Radio options (partner type selection cards)
UPDATE public.reregistration_questions SET input_type = 'radio_options' WHERE field_key IN (
  'partner_type', 'partner_self_match', 'partner_system_match',
  'partner_family', 'partner_tarteel'
);
-- File upload
UPDATE public.reregistration_questions SET input_type = 'file' WHERE field_key IN (
  'akad_upload'
);


-- ═══════════════════════════════════════════════════════════════
-- 3) muallimah_registration_questions (Mu'allimah)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE public.muallimah_registration_questions
  ADD COLUMN IF NOT EXISTS input_type text NOT NULL DEFAULT 'text';

-- Text input
UPDATE public.muallimah_registration_questions SET input_type = 'text' WHERE field_key IN (
  'tajweed_institution', 'quran_institution', 'teaching_communities',
  'memorized_tajweed_matan', 'studied_matan_exegesis'
);
-- Number input
UPDATE public.muallimah_registration_questions SET input_type = 'number' WHERE field_key IN (
  'memorization_level'
);
-- Multi-select (checkbox grid for juz selection)
UPDATE public.muallimah_registration_questions SET input_type = 'multi_select' WHERE field_key IN (
  'memorized_juz', 'examined_juz', 'certified_juz', 'preferred_juz'
);
-- Checkbox (single toggle)
UPDATE public.muallimah_registration_questions SET input_type = 'checkbox' WHERE field_key IN (
  'class_tikrar', 'class_pratikrar', 'class_paid'
);
-- Select dropdown
UPDATE public.muallimah_registration_questions SET input_type = 'select' WHERE field_key IN (
  'paid_class_scheme', 'preferred_max_thalibah'
);
-- Info / schedule container
UPDATE public.muallimah_registration_questions SET input_type = 'info' WHERE field_key IN (
  'teaching_schedule'
);
-- All Section 3 items (Akad Komitmen) are checkboxes
UPDATE public.muallimah_registration_questions SET input_type = 'checkbox' WHERE section = 3;
