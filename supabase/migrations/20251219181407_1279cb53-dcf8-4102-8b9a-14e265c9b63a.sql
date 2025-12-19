-- Schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  director_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Licenses table
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_days INTEGER DEFAULT 15,
  validity_months INTEGER DEFAULT 12,
  start_date TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  max_devices INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Device activations table
CREATE TABLE public.device_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_info JSONB,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(license_id, device_id)
);

-- Backups table
CREATE TABLE public.backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'manual',
  file_path TEXT,
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Public read policies for license validation (needed for app to check license)
CREATE POLICY "Allow public read for license validation" ON public.licenses
  FOR SELECT USING (true);

CREATE POLICY "Allow public read for schools" ON public.schools
  FOR SELECT USING (true);

CREATE POLICY "Allow public read for device activations" ON public.device_activations
  FOR SELECT USING (true);

CREATE POLICY "Allow public read for backups" ON public.backups
  FOR SELECT USING (true);

-- Insert policies
CREATE POLICY "Allow insert for licenses" ON public.licenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for schools" ON public.schools
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for device_activations" ON public.device_activations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert for backups" ON public.backups
  FOR INSERT WITH CHECK (true);

-- Update policies
CREATE POLICY "Allow update for licenses" ON public.licenses
  FOR UPDATE USING (true);

CREATE POLICY "Allow update for schools" ON public.schools
  FOR UPDATE USING (true);

CREATE POLICY "Allow update for device_activations" ON public.device_activations
  FOR UPDATE USING (true);

CREATE POLICY "Allow update for backups" ON public.backups
  FOR UPDATE USING (true);

-- Delete policies
CREATE POLICY "Allow delete for backups" ON public.backups
  FOR DELETE USING (true);

-- Function to generate unique license key
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Function to check license validity
CREATE OR REPLACE FUNCTION public.check_license_validity(p_license_key TEXT, p_device_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_license RECORD;
  v_device_count INTEGER;
  v_remaining_days INTEGER;
  v_result JSONB;
BEGIN
  -- Get license
  SELECT * INTO v_license FROM public.licenses WHERE license_key = p_license_key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'رمز الترخيص غير صالح');
  END IF;
  
  IF NOT v_license.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'الترخيص غير مفعل');
  END IF;
  
  -- Check trial
  IF v_license.is_trial THEN
    v_remaining_days := v_license.trial_days - EXTRACT(DAY FROM (now() - v_license.trial_start_date))::INTEGER;
    IF v_remaining_days <= 0 THEN
      RETURN jsonb_build_object('valid', false, 'error', 'انتهت الفترة التجريبية', 'is_trial', true, 'remaining_days', 0);
    END IF;
    RETURN jsonb_build_object('valid', true, 'is_trial', true, 'remaining_days', v_remaining_days);
  END IF;
  
  -- Check expiry
  IF v_license.expiry_date IS NOT NULL AND v_license.expiry_date < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'انتهت صلاحية الترخيص', 'expiry_date', v_license.expiry_date);
  END IF;
  
  -- Check device count
  SELECT COUNT(*) INTO v_device_count FROM public.device_activations 
  WHERE license_id = v_license.id AND is_active = true;
  
  -- Check if device already registered
  IF EXISTS (SELECT 1 FROM public.device_activations WHERE license_id = v_license.id AND device_id = p_device_id) THEN
    -- Update last seen
    UPDATE public.device_activations SET last_seen_at = now() WHERE license_id = v_license.id AND device_id = p_device_id;
    v_remaining_days := EXTRACT(DAY FROM (v_license.expiry_date - now()))::INTEGER;
    RETURN jsonb_build_object('valid', true, 'is_trial', false, 'remaining_days', v_remaining_days, 'devices_used', v_device_count, 'max_devices', v_license.max_devices);
  END IF;
  
  -- Check if can add new device
  IF v_device_count >= v_license.max_devices THEN
    RETURN jsonb_build_object('valid', false, 'error', 'تم الوصول للحد الأقصى من الأجهزة', 'devices_used', v_device_count, 'max_devices', v_license.max_devices);
  END IF;
  
  -- Register new device
  INSERT INTO public.device_activations (license_id, device_id) VALUES (v_license.id, p_device_id);
  v_device_count := v_device_count + 1;
  v_remaining_days := EXTRACT(DAY FROM (v_license.expiry_date - now()))::INTEGER;
  
  RETURN jsonb_build_object('valid', true, 'is_trial', false, 'remaining_days', v_remaining_days, 'devices_used', v_device_count, 'max_devices', v_license.max_devices, 'new_device', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();