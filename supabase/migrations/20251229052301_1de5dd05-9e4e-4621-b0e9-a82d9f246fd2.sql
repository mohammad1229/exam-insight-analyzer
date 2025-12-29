-- Create system_admin_sessions table for session-based authentication
CREATE TABLE IF NOT EXISTS public.system_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.system_admins(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_admin_sessions_token ON public.system_admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_system_admin_sessions_expiry ON public.system_admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_system_admin_sessions_admin ON public.system_admin_sessions(admin_id);

-- Enable RLS
ALTER TABLE public.system_admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access sessions (no direct client access)
-- No policies needed as we only access through edge functions with service role