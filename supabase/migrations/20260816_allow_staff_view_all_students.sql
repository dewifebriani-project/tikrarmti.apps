-- Allow musyrifah and muallimah to view all halaqah_students
CREATE POLICY halaqah_students_select_staff ON public.halaqah_students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (
        'musyrifah' = ANY(roles) OR
        'muallimah' = ANY(roles)
      )
    )
  );
