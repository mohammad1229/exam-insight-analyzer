-- Create school_admins table for school administrators
CREATE TABLE public.school_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read for school_admins" 
ON public.school_admins 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert for school_admins" 
ON public.school_admins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for school_admins" 
ON public.school_admins 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete for school_admins" 
ON public.school_admins 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_school_admins_updated_at
BEFORE UPDATE ON public.school_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();