-- Add nama_kunyah column to users table
-- nama_kunyah is optional (nullable) and stores user's nickname/kunyah

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS nama_kunyah TEXT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.users.nama_kunyah IS 'Nama kunyah/panggilan user (optional)';

-- Create index for better query performance (optional, but recommended if we search by nama_kunyah)
CREATE INDEX IF NOT EXISTS idx_users_nama_kunyah ON public.users USING btree (nama_kunyah) TABLESPACE pg_default;
