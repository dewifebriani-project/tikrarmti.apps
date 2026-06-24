CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.faqs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Enable insert for admin') THEN
        CREATE POLICY "Enable insert for admin" ON public.faqs FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE 'admin' = ANY(roles)));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Enable update for admin') THEN
        CREATE POLICY "Enable update for admin" ON public.faqs FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE 'admin' = ANY(roles)));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Enable delete for admin') THEN
        CREATE POLICY "Enable delete for admin" ON public.faqs FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE 'admin' = ANY(roles)));
    END IF;
END
$$;

-- Insert default data
INSERT INTO public.faqs (category, icon, color, questions, sort_order) VALUES
('Program Umum', 'BookOpen', 'green', '[{"q": "Apa itu Program Tahfidz Tikrar MTI?", "a": "Program Tahfidz Tikrar MTI adalah program hafalan Al-Qur''an gratis yang menggunakan metode Tikrar 40x. Program ini khusus untuk Ibu rumah tangga dan remaja putri yang serius ingin menghafal Al-Qur''an dengan komitmen waktu minimal 2 jam per hari."}]'::jsonb, 1),
('Metode Belajar', 'Shield', 'blue', '[{"q": "Apa itu Metode Tikrar 40x?", "a": "Metode Tikrar 40x adalah metode hafalan dengan mengulang bacaan ayat sebanyak 40 kali. Metode ini terdiri dari 7 tahapan: Rabth (menyambung hafalan), Muraja''ah blok terakhir, Simak murattal, Tikrar dengan melihat mushaf (40x), Tasmi'' via rekaman, Simak rekaman pribadi, dan Tikrar tanpa mushaf (40x)."}]'::jsonb, 2);
