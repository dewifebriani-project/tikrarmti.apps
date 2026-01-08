-- Add missing partner_wa_phone column to daftar_ulang_submissions table
-- This column is needed to store WhatsApp phone number for family partners

-- Add the column
ALTER TABLE public.daftar_ulang_submissions
ADD COLUMN IF NOT EXISTS partner_wa_phone VARCHAR;

-- Add comment
COMMENT ON COLUMN public.daftar_ulang_submissions.partner_wa_phone IS 'WhatsApp phone number for family partner (when partner_type is family)';
