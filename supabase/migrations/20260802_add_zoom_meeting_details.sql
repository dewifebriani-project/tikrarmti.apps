-- Migration: Add zoom meeting_id, passcode columns and halaqah zoom_link_id FK
-- Run this in Supabase SQL Editor

-- 1. Add meeting_id and passcode to batch_zoom_links
ALTER TABLE public.batch_zoom_links
ADD COLUMN IF NOT EXISTS meeting_id TEXT,
ADD COLUMN IF NOT EXISTS passcode TEXT;

-- 2. Add zoom_link_id FK to halaqah (references batch_zoom_links)
ALTER TABLE public.halaqah
ADD COLUMN IF NOT EXISTS zoom_link_id UUID REFERENCES public.batch_zoom_links(id) ON DELETE SET NULL;
