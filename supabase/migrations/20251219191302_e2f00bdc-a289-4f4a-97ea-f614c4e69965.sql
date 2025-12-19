-- Create system_updates table for managing updates and optional features
CREATE TABLE public.system_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'feature',
  is_optional BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create school_features table to track enabled features per school
CREATE TABLE public.school_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  update_id UUID NOT NULL REFERENCES public.system_updates(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  enabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for system_updates
CREATE POLICY "Allow public read for system_updates" 
ON public.system_updates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert for system_updates" 
ON public.system_updates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for system_updates" 
ON public.system_updates 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete for system_updates" 
ON public.system_updates 
FOR DELETE 
USING (true);

-- RLS policies for school_features
CREATE POLICY "Allow public read for school_features" 
ON public.school_features 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert for school_features" 
ON public.school_features 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for school_features" 
ON public.school_features 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete for school_features" 
ON public.school_features 
FOR DELETE 
USING (true);

-- Create indexes
CREATE INDEX idx_system_updates_type ON public.system_updates(update_type);
CREATE INDEX idx_system_updates_active ON public.system_updates(is_active);
CREATE INDEX idx_school_features_school ON public.school_features(school_id);
CREATE INDEX idx_school_features_update ON public.school_features(update_id);

-- Add trigger for updated_at
CREATE TRIGGER update_system_updates_updated_at
BEFORE UPDATE ON public.system_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();