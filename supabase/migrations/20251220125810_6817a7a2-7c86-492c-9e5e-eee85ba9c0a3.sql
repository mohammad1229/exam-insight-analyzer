-- Enable pgcrypto extension for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update verify_admin_login function to use bcrypt
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Find admin with matching username and verify password using bcrypt
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
  
  -- Check password using bcrypt
  -- Support both old base64 passwords (for migration) and new bcrypt passwords
  IF v_admin.password_hash LIKE '$2a$%' OR v_admin.password_hash LIKE '$2b$%' THEN
    -- New bcrypt format
    IF v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
      RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    END IF;
  ELSE
    -- Old base64 format - check and migrate
    IF v_admin.password_hash != encode(p_password::bytea, 'base64') THEN
      RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
    END IF;
    
    -- Migrate to bcrypt on successful login
    UPDATE public.school_admins 
    SET password_hash = crypt(p_password, gen_salt('bf'))
    WHERE id = v_admin.id;
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

-- Create a secure function to hash passwords server-side
CREATE OR REPLACE FUNCTION public.hash_password(p_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role to call this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can hash passwords';
  END IF;
  
  RETURN crypt(p_password, gen_salt('bf'));
END;
$$;

-- Secure the generate_license_key function
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  segment INTEGER;
BEGIN
  -- Only allow service role to generate license keys
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can generate license keys';
  END IF;

  FOR segment IN 1..4 LOOP
    IF segment > 1 THEN
      result := result || '-';
    END IF;
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  RETURN result;
END;
$$;