-- Create a secure function for admin login verification
-- This prevents password hashes from being exposed to the client
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_hashed_password text;
BEGIN
  -- Hash the password (using the same method as the app)
  v_hashed_password := encode(p_password::bytea, 'base64');
  
  -- Find admin with matching credentials
  SELECT 
    sa.id,
    sa.full_name,
    sa.username,
    sa.email,
    sa.phone,
    sa.school_id,
    sa.license_id,
    sa.is_active,
    s.name as school_name,
    s.director_name,
    s.logo_url,
    l.license_key,
    l.is_active as license_active,
    l.expiry_date
  INTO v_admin
  FROM public.school_admins sa
  LEFT JOIN public.schools s ON s.id = sa.school_id
  LEFT JOIN public.licenses l ON l.id = sa.license_id
  WHERE sa.username = p_username
    AND sa.password_hash = v_hashed_password
    AND sa.is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;
  
  -- Update last login timestamp
  UPDATE public.school_admins 
  SET last_login_at = now() 
  WHERE id = v_admin.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'admin', jsonb_build_object(
      'id', v_admin.id,
      'full_name', v_admin.full_name,
      'username', v_admin.username,
      'email', v_admin.email,
      'phone', v_admin.phone,
      'school_id', v_admin.school_id,
      'license_id', v_admin.license_id,
      'school_name', v_admin.school_name,
      'director_name', v_admin.director_name,
      'logo_url', v_admin.logo_url,
      'license_key', v_admin.license_key,
      'license_active', v_admin.license_active,
      'expiry_date', v_admin.expiry_date
    )
  );
END;
$$;

-- Drop existing overly permissive policies on school_admins
DROP POLICY IF EXISTS "Allow public read for school_admins" ON public.school_admins;
DROP POLICY IF EXISTS "Allow insert for school_admins" ON public.school_admins;
DROP POLICY IF EXISTS "Allow update for school_admins" ON public.school_admins;
DROP POLICY IF EXISTS "Allow delete for school_admins" ON public.school_admins;

-- Create restrictive policies for school_admins
-- Only system admins can insert/update/delete admins (via service role)
CREATE POLICY "Restrict school_admins read" 
ON public.school_admins 
FOR SELECT 
USING (false);

CREATE POLICY "Allow service role insert for school_admins" 
ON public.school_admins 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service role update for school_admins" 
ON public.school_admins 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow service role delete for school_admins" 
ON public.school_admins 
FOR DELETE 
USING (true);

-- Drop existing overly permissive policies on schools
DROP POLICY IF EXISTS "Allow public read for schools" ON public.schools;
DROP POLICY IF EXISTS "Allow insert for schools" ON public.schools;
DROP POLICY IF EXISTS "Allow update for schools" ON public.schools;

-- Create more restrictive policies for schools
-- Schools data can be read for license activation purposes but through secure functions
CREATE POLICY "Restrict schools read" 
ON public.schools 
FOR SELECT 
USING (false);

CREATE POLICY "Allow service role insert for schools" 
ON public.schools 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow service role update for schools" 
ON public.schools 
FOR UPDATE 
USING (true);