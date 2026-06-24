ALTER TABLE public.pendaftaran_tikrar_tahfidz 
ADD COLUMN IF NOT EXISTS oral_assessment_audio_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.pendaftaran_tikrar_tahfidz.oral_assessment_audio_url IS 'URL to the admin audio feedback for the oral selection';
