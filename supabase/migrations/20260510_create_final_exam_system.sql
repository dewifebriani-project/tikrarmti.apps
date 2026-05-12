-- ============================================================================
-- FINAL EXAM SYSTEM MIGRATION
-- ============================================================================

-- 1. FINAL EXAM SCHEDULES
CREATE TABLE IF NOT EXISTS public.final_exam_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE,
  exam_type character varying(50) NOT NULL DEFAULT 'oral', -- 'oral', 'written'
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  examiner_id uuid REFERENCES public.users(id), -- Muallimah/Musyrifah
  max_quota integer DEFAULT 5,
  current_count integer DEFAULT 0,
  location_link text, -- Zoom/Meeting Link
  notes text,
  status character varying(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),

  CONSTRAINT final_exam_schedules_type_check CHECK (exam_type IN ('oral', 'written'))
);

-- 2. FINAL EXAM REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.final_exam_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  schedule_id uuid NOT NULL REFERENCES public.final_exam_schedules(id) ON DELETE CASCADE,
  status character varying(20) DEFAULT 'registered', -- 'registered', 'confirmed', 'completed', 'cancelled'
  score_lisan integer,
  score_tulisan integer,
  feedback text,
  graded_at timestamp with time zone,
  graded_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),

  UNIQUE(user_id, schedule_id) -- User can only register once per schedule
);

-- 3. FINAL EXAM QUESTIONS (MCQ)
CREATE TABLE IF NOT EXISTS public.final_exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  juz_number integer,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- Array of strings
  correct_answer_index integer NOT NULL,
  explanation text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- 4. RLS POLICIES
ALTER TABLE public.final_exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_exam_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_exam_questions ENABLE ROW LEVEL SECURITY;

-- Schedules: Everyone can see active schedules, Admin/Muallimah can manage
CREATE POLICY "Everyone can see active schedules" ON public.final_exam_schedules
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage schedules" ON public.final_exam_schedules
  FOR ALL USING ('admin' = ANY(
    SELECT role FROM users WHERE id = auth.uid()
  ));

-- Registrations: Users can see/manage own, Admins/Examiners can see all
CREATE POLICY "Users can manage own registrations" ON public.final_exam_registrations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Examiners can see registrations for their schedules" ON public.final_exam_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM final_exam_schedules 
      WHERE final_exam_schedules.id = final_exam_registrations.schedule_id 
      AND final_exam_schedules.examiner_id = auth.uid()
    )
    OR 'admin' = ANY(SELECT role FROM users WHERE id = auth.uid())
    OR 'musyrifah' = ANY(SELECT role FROM users WHERE id = auth.uid())
  );

-- Questions: Admins can manage, students can only SELECT during exam (handled via RPC/API)
CREATE POLICY "Admins can manage questions" ON public.final_exam_questions
  FOR ALL USING ('admin' = ANY(
    SELECT role FROM users WHERE id = auth.uid()
  ));

-- 5. FUNCTION TO UPDATE QUOTA
CREATE OR REPLACE FUNCTION public.handle_exam_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.final_exam_schedules 
    SET current_count = current_count + 1 
    WHERE id = NEW.schedule_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.final_exam_schedules 
    SET current_count = current_count - 1 
    WHERE id = OLD.schedule_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_exam_quota
AFTER INSERT OR DELETE ON public.final_exam_registrations
FOR EACH ROW EXECUTE FUNCTION public.handle_exam_registration();
