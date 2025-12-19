-- Create backups table for automatic backups
ALTER TABLE public.backups ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_school_id ON public.backups(school_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON public.backups(created_at DESC);