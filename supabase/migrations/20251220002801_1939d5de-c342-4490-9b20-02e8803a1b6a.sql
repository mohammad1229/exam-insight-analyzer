
-- Fix school_admins RLS policies to properly restrict access
DROP POLICY IF EXISTS "Allow service role delete for school_admins" ON public.school_admins;
DROP POLICY IF EXISTS "Allow service role insert for school_admins" ON public.school_admins;
DROP POLICY IF EXISTS "Allow service role update for school_admins" ON public.school_admins;

-- Create proper restrictive policies that only allow service role
CREATE POLICY "Service role only - insert school_admins" 
ON public.school_admins 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update school_admins" 
ON public.school_admins 
FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - delete school_admins" 
ON public.school_admins 
FOR DELETE 
USING (auth.role() = 'service_role');

-- Fix schools RLS policies to properly restrict access
DROP POLICY IF EXISTS "Allow service role insert for schools" ON public.schools;
DROP POLICY IF EXISTS "Allow service role update for schools" ON public.schools;

-- Create proper restrictive policies that only allow service role
CREATE POLICY "Service role only - insert schools" 
ON public.schools 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update schools" 
ON public.schools 
FOR UPDATE 
USING (auth.role() = 'service_role');
