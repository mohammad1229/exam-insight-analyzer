-- Create system_admins table for secure system admin authentication
CREATE TABLE IF NOT EXISTS public.system_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- Only service role can access system_admins
CREATE POLICY "Service role only - read system_admins"
ON public.system_admins FOR SELECT
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - insert system_admins"
ON public.system_admins FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update system_admins"
ON public.system_admins FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - delete system_admins"
ON public.system_admins FOR DELETE
USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_system_admins_updated_at
BEFORE UPDATE ON public.system_admins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system admin with bcrypt hash (password: 'SystemAdmin2024!')
-- The hash is for 'SystemAdmin2024!' using bcrypt with cost factor 10
INSERT INTO public.system_admins (username, password_hash, full_name)
VALUES ('sysadmin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqPiEhqWUGDJDPjqZ1qEewM9H5p5W', 'مسؤول النظام')
ON CONFLICT (username) DO NOTHING;