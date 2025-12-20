
-- ==========================================
-- Fix licenses table RLS policies
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for license validation" ON public.licenses;
DROP POLICY IF EXISTS "Allow insert for licenses" ON public.licenses;
DROP POLICY IF EXISTS "Allow update for licenses" ON public.licenses;

-- Only service role can read licenses (for validation via RPC function)
CREATE POLICY "Service role only - read licenses" 
ON public.licenses 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only service role can insert licenses
CREATE POLICY "Service role only - insert licenses" 
ON public.licenses 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update licenses
CREATE POLICY "Service role only - update licenses" 
ON public.licenses 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- ==========================================
-- Fix device_activations table RLS policies
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for device activations" ON public.device_activations;
DROP POLICY IF EXISTS "Allow insert for device_activations" ON public.device_activations;
DROP POLICY IF EXISTS "Allow update for device_activations" ON public.device_activations;

-- Only service role can read device activations
CREATE POLICY "Service role only - read device_activations" 
ON public.device_activations 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only service role can insert device activations
CREATE POLICY "Service role only - insert device_activations" 
ON public.device_activations 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update device activations
CREATE POLICY "Service role only - update device_activations" 
ON public.device_activations 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- ==========================================
-- Fix backups table RLS policies
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for backups" ON public.backups;
DROP POLICY IF EXISTS "Allow insert for backups" ON public.backups;
DROP POLICY IF EXISTS "Allow update for backups" ON public.backups;
DROP POLICY IF EXISTS "Allow delete for backups" ON public.backups;

-- Only service role can read backups
CREATE POLICY "Service role only - read backups" 
ON public.backups 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only service role can insert backups
CREATE POLICY "Service role only - insert backups" 
ON public.backups 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update backups
CREATE POLICY "Service role only - update backups" 
ON public.backups 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Only service role can delete backups
CREATE POLICY "Service role only - delete backups" 
ON public.backups 
FOR DELETE 
USING (auth.role() = 'service_role');

-- ==========================================
-- Fix system_updates table RLS policies
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for system_updates" ON public.system_updates;
DROP POLICY IF EXISTS "Allow insert for system_updates" ON public.system_updates;
DROP POLICY IF EXISTS "Allow update for system_updates" ON public.system_updates;
DROP POLICY IF EXISTS "Allow delete for system_updates" ON public.system_updates;

-- Allow public read for system updates (intentional - for update notifications)
CREATE POLICY "Public read for system_updates" 
ON public.system_updates 
FOR SELECT 
USING (true);

-- Only service role can insert system updates
CREATE POLICY "Service role only - insert system_updates" 
ON public.system_updates 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update system updates
CREATE POLICY "Service role only - update system_updates" 
ON public.system_updates 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Only service role can delete system updates
CREATE POLICY "Service role only - delete system_updates" 
ON public.system_updates 
FOR DELETE 
USING (auth.role() = 'service_role');

-- ==========================================
-- Fix school_features table RLS policies
-- ==========================================
DROP POLICY IF EXISTS "Allow public read for school_features" ON public.school_features;
DROP POLICY IF EXISTS "Allow insert for school_features" ON public.school_features;
DROP POLICY IF EXISTS "Allow update for school_features" ON public.school_features;
DROP POLICY IF EXISTS "Allow delete for school_features" ON public.school_features;

-- Only service role can read school features
CREATE POLICY "Service role only - read school_features" 
ON public.school_features 
FOR SELECT 
USING (auth.role() = 'service_role');

-- Only service role can insert school features
CREATE POLICY "Service role only - insert school_features" 
ON public.school_features 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Only service role can update school features
CREATE POLICY "Service role only - update school_features" 
ON public.school_features 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Only service role can delete school features
CREATE POLICY "Service role only - delete school_features" 
ON public.school_features 
FOR DELETE 
USING (auth.role() = 'service_role');
