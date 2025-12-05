-- Update default role untuk user baru menjadi calon_thalibah
-- Jalankan di Supabase SQL Editor

-- Update function handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a user profile for the new authenticated user
    INSERT INTO public.users (id, email, full_name, role, password_hash)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'calon_thalibah'),
        'managed_by_auth_system'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifikasi
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
