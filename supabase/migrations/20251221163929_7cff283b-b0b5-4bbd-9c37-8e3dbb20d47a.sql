-- Update verify_admin_login function to use plain text passwords
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_username text, p_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Check password - plain text comparison
  IF v_admin.password_hash != p_password THEN
    RETURN jsonb_build_object('success', false, 'error', 'اسم المستخدم أو كلمة المرور غير صحيحة');
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
$function$;

-- Update change_admin_password function to use plain text
CREATE OR REPLACE FUNCTION public.change_admin_password(p_admin_id uuid, p_new_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update password with plain text and clear must_change_password
  UPDATE public.school_admins 
  SET 
    password_hash = p_new_password,
    must_change_password = false,
    updated_at = now()
  WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تغيير كلمة المرور بنجاح');
END;
$function$;