-- Create wisdoms table for storing quotes and wisdoms
CREATE TABLE public.wisdoms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT,
  category TEXT DEFAULT 'general',
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wisdoms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wisdoms
-- Allow public read for active wisdoms (for display)
CREATE POLICY "Public can read active wisdoms"
ON public.wisdoms
FOR SELECT
USING (is_active = true);

-- Service role only for modifications
CREATE POLICY "Service role only - insert wisdoms"
ON public.wisdoms
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update wisdoms"
ON public.wisdoms
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - delete wisdoms"
ON public.wisdoms
FOR DELETE
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_wisdoms_updated_at
BEFORE UPDATE ON public.wisdoms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_wisdoms_school_id ON public.wisdoms(school_id);
CREATE INDEX idx_wisdoms_is_active ON public.wisdoms(is_active);
CREATE INDEX idx_wisdoms_is_global ON public.wisdoms(is_global);