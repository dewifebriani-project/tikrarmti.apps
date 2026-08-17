-- MIGRATION: Create transfer_schedule_requests table

CREATE TABLE IF NOT EXISTS public.transfer_schedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  from_halaqah_id UUID REFERENCES public.halaqah(id) ON DELETE SET NULL,
  to_halaqah_id UUID NOT NULL REFERENCES public.halaqah(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transfer_schedule_requests_user_batch_idx ON public.transfer_schedule_requests(user_id, batch_id);
CREATE INDEX IF NOT EXISTS transfer_schedule_requests_status_idx ON public.transfer_schedule_requests(status);

ALTER TABLE public.transfer_schedule_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transfer_schedule_requests_select_own ON public.transfer_schedule_requests;
CREATE POLICY transfer_schedule_requests_select_own ON public.transfer_schedule_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS transfer_schedule_requests_insert_own ON public.transfer_schedule_requests;
CREATE POLICY transfer_schedule_requests_insert_own ON public.transfer_schedule_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS transfer_schedule_requests_select_staff ON public.transfer_schedule_requests;
CREATE POLICY transfer_schedule_requests_select_staff ON public.transfer_schedule_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND ('admin' = ANY(roles) OR 'musyrifah' = ANY(roles) OR 'muallimah' = ANY(roles))));

DROP POLICY IF EXISTS transfer_schedule_requests_update_admin ON public.transfer_schedule_requests;
CREATE POLICY transfer_schedule_requests_update_admin ON public.transfer_schedule_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND 'admin' = ANY(roles)));

CREATE OR REPLACE FUNCTION update_transfer_schedule_requests_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS transfer_schedule_requests_updated_at ON public.transfer_schedule_requests;
CREATE TRIGGER transfer_schedule_requests_updated_at BEFORE UPDATE ON public.transfer_schedule_requests FOR EACH ROW EXECUTE FUNCTION update_transfer_schedule_requests_updated_at();

NOTIFY pgrst, 'reload schema';
