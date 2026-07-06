-- Add needs_revision to pendaftaran_tikrar_tahfidz to handle exceptions for VN re-recording
ALTER TABLE public.pendaftaran_tikrar_tahfidz
ADD COLUMN IF NOT EXISTS needs_revision BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.needs_revision IS 'Flag to allow Thalibah to upload a new VN ignoring the batch selection deadlines (used when admin requests a re-record)';
