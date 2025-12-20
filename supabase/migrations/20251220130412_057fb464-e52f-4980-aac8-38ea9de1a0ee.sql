-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'teacher');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('school_admin', 'teacher')),
  role app_role NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, user_type)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles - service role only
CREATE POLICY "Service role only - read user_roles" 
ON public.user_roles FOR SELECT 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - insert user_roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update user_roles" 
ON public.user_roles FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - delete user_roles" 
ON public.user_roles FOR DELETE 
USING (auth.role() = 'service_role');

-- Add must_change_password column to school_admins
ALTER TABLE public.school_admins 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- Create permissions table for granular permissions
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('school_admin', 'teacher')),
  permission_key TEXT NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, user_type, permission_key)
);

-- Enable RLS on permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions - service role only
CREATE POLICY "Service role only - read permissions" 
ON public.permissions FOR SELECT 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - insert permissions" 
ON public.permissions FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role only - update permissions" 
ON public.permissions FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only - delete permissions" 
ON public.permissions FOR DELETE 
USING (auth.role() = 'service_role');

-- Create function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _user_type TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND user_type = _user_type
      AND role = _role
  )
$$;

-- Create function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _user_type TEXT, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.permissions
    WHERE user_id = _user_id
      AND user_type = _user_type
      AND permission_key = _permission_key
      AND is_granted = true
  )
$$;

-- Update verify_admin_login to return must_change_password
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
  v_role app_role;
BEGIN
  -- Find admin with matching username
  SELECT 
    sa.id,
    sa.full_name,
    sa.username,
    sa.email,
    sa.phone,
    sa.school_id,
    sa.license_id,
    sa.is_active,
    sa.password_hash,
    sa.must_change_password,
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
    AND sa.is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
  END IF;
  
  -- Check password using bcrypt or base64
  IF v_admin.password_hash LIKE '$2a$%' OR v_admin.password_hash LIKE '$2b$%' THEN
    IF v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
      RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    END IF;
  ELSE
    IF v_admin.password_hash != encode(p_password::bytea, 'base64') THEN
      RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    END IF;
    
    -- Migrate to bcrypt on successful login
    UPDATE public.school_admins 
    SET password_hash = crypt(p_password, gen_salt('bf'))
    WHERE id = v_admin.id;
  END IF;
  
  -- Get user role
  SELECT role INTO v_role FROM public.user_roles 
  WHERE user_id = v_admin.id AND user_type = 'school_admin';
  
  -- Update last login timestamp
  UPDATE public.school_admins 
  SET last_login_at = now() 
  WHERE id = v_admin.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'must_change_password', v_admin.must_change_password,
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
      'expiry_date', v_admin.expiry_date,
      'role', COALESCE(v_role::text, 'school_admin'),
      'must_change_password', v_admin.must_change_password
    )
  );
END;
$$;

-- Create function to change password and clear must_change_password flag
CREATE OR REPLACE FUNCTION public.change_admin_password(p_admin_id UUID, p_new_password TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update password with bcrypt hash and clear must_change_password
  UPDATE public.school_admins 
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    must_change_password = false,
    updated_at = now()
  WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تغيير كلمة المرور بنجاح');
END;
$$;