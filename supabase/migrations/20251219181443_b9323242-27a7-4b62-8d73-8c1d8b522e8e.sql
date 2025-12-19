-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT 
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

CREATE OR REPLACE FUNCTION public.check_license_validity(p_license_key TEXT, p_device_id TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_license RECORD;
  v_device_count INTEGER;
  v_remaining_days INTEGER;
BEGIN
  SELECT * INTO v_license FROM public.licenses WHERE license_key = p_license_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'رمز الترخيص غير صالح');
  END IF;
  
  IF NOT v_license.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'الترخيص غير مفعل');
  END IF;
  
  IF v_license.is_trial THEN
    v_remaining_days := v_license.trial_days - EXTRACT(DAY FROM (now() - v_license.trial_start_date))::INTEGER;
    IF v_remaining_days <= 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'انتهت الفترة التجريبية', 'is_trial', true, 'remaining_days', 0);
    END IF;
    RETURN jsonb_build_object('valid', true, 'is_trial', true, 'remaining_days', v_remaining_days);
  END IF;
  
  IF v_license.expiry_date IS NOT NULL AND v_license.expiry_date < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'انتهت صلاحية الترخيص', 'expiry_date', v_license.expiry_date);
  END IF;
  
  SELECT COUNT(*) INTO v_device_count FROM public.device_activations 
  WHERE license_id = v_license.id AND is_active = true;
  
  IF EXISTS (SELECT 1 FROM public.device_activations WHERE license_id = v_license.id AND device_id = p_device_id) THEN
    UPDATE public.device_activations SET last_seen_at = now() WHERE license_id = v_license.id AND device_id = p_device_id;
    v_remaining_days := EXTRACT(DAY FROM (v_license.expiry_date - now()))::INTEGER;
    RETURN jsonb_build_object('valid', true, 'is_trial', false, 'remaining_days', v_remaining_days, 'devices_used', v_device_count, 'max_devices', v_license.max_devices);
  END IF;
  
  IF v_device_count >= v_license.max_devices THEN
    RETURN jsonb_build_object('valid', false, 'error', 'تم الوصول للحد الأقصى من الأجهزة', 'devices_used', v_device_count, 'max_devices', v_license.max_devices);
  END IF;
  
  INSERT INTO public.device_activations (license_id, device_id) VALUES (v_license.id, p_device_id);
  v_device_count := v_device_count + 1;
  v_remaining_days := EXTRACT(DAY FROM (v_license.expiry_date - now()))::INTEGER;
  
  RETURN jsonb_build_object('valid', true, 'is_trial', false, 'remaining_days', v_remaining_days, 'devices_used', v_device_count, 'max_devices', v_license.max_devices, 'new_device', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;