-- Add new columns for group links
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS whatsapp_group_link TEXT,
ADD COLUMN IF NOT EXISTS group_reminder_link TEXT,
ADD COLUMN IF NOT EXISTS group_diskusi_link TEXT;
