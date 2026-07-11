-- Create akad_quiz_questions table
CREATE TABLE IF NOT EXISTS public.akad_quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    points INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create akad_quiz_attempts table
CREATE TABLE IF NOT EXISTS public.akad_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.akad_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.akad_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for akad_quiz_questions
-- Admins can do everything
CREATE POLICY "Admins can manage akad_quiz_questions" ON public.akad_quiz_questions
    FOR ALL
    TO authenticated
    USING (
        (SELECT (raw_user_meta_data->>'roles')::jsonb ? 'admin' 
         FROM auth.users WHERE id = auth.uid())
    );

-- Everyone authenticated can read active questions
CREATE POLICY "Users can view active akad_quiz_questions" ON public.akad_quiz_questions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policies for akad_quiz_attempts
-- Users can read their own attempts
CREATE POLICY "Users can read own akad_quiz_attempts" ON public.akad_quiz_attempts
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own attempts
CREATE POLICY "Users can insert own akad_quiz_attempts" ON public.akad_quiz_attempts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can read all attempts
CREATE POLICY "Admins can read all akad_quiz_attempts" ON public.akad_quiz_attempts
    FOR SELECT
    TO authenticated
    USING (
        (SELECT (raw_user_meta_data->>'roles')::jsonb ? 'admin' 
         FROM auth.users WHERE id = auth.uid())
    );
