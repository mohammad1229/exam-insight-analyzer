import { supabase } from "@/integrations/supabase/client";

interface LicenseValidityResult {
  valid: boolean;
  error?: string;
  is_trial?: boolean;
  remaining_days?: number;
  devices_used?: number;
  max_devices?: number;
  new_device?: boolean;
  expiry_date?: string;
}

// Generate unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

// Get license info from local storage
export const getStoredLicense = () => {
  const stored = localStorage.getItem("licenseInfo");
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};

// Store license info
export const storeLicense = (licenseInfo: any) => {
  localStorage.setItem("licenseInfo", JSON.stringify(licenseInfo));
};

// Clear license
export const clearLicense = () => {
  localStorage.removeItem("licenseInfo");
};

// Start trial
export const startTrial = async (schoolName: string) => {
  try {
    // Create school
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .insert({ name: schoolName })
      .select()
      .single();

    if (schoolError) throw schoolError;

    // Generate trial license
    const { data: licenseKey } = await supabase.rpc("generate_license_key");

    const { data: license, error: licenseError } = await supabase
      .from("licenses")
      .insert({
        license_key: licenseKey,
        school_id: school.id,
        is_trial: true,
        trial_start_date: new Date().toISOString(),
        trial_days: 15,
      })
      .select()
      .single();

    if (licenseError) throw licenseError;

    const licenseInfo = {
      licenseKey,
      schoolId: school.id,
      schoolName,
      directorName: "",
      isTrial: true,
      remainingDays: 15,
      startDate: new Date().toISOString(),
    };

    storeLicense(licenseInfo);
    
    // Store school name in localStorage for Welcome page
    localStorage.setItem("schoolName", schoolName);
    localStorage.setItem("directorName", "");
    localStorage.setItem("currentSchoolId", school.id);
    
    return { success: true, licenseInfo };
  } catch (error: any) {
    console.error("Error starting trial:", error);
    return { success: false, error: error.message };
  }
};

// Activate license
export const activateLicense = async (licenseKey: string) => {
  try {
    const deviceId = getDeviceId();

    const { data, error } = await supabase.rpc("check_license_validity", {
      p_license_key: licenseKey,
      p_device_id: deviceId,
    });

    if (error) throw error;

    const result = data as unknown as LicenseValidityResult;

    if (!result.valid) {
      return { success: false, error: result.error };
    }

    // Get license details
    const { data: license } = await supabase
      .from("licenses")
      .select("*, schools(*)")
      .eq("license_key", licenseKey)
      .single();

    const licenseInfo = {
      licenseKey,
      schoolId: license?.school_id,
      schoolName: (license?.schools as any)?.name || "",
      directorName: (license?.schools as any)?.director_name || "",
      isTrial: result.is_trial,
      remainingDays: result.remaining_days,
      devicesUsed: result.devices_used,
      maxDevices: result.max_devices,
      expiryDate: license?.expiry_date,
    };

    storeLicense(licenseInfo);
    
    // Store school name and director in localStorage for Welcome page
    localStorage.setItem("schoolName", licenseInfo.schoolName);
    localStorage.setItem("directorName", licenseInfo.directorName);
    localStorage.setItem("currentSchoolId", licenseInfo.schoolId || "");
    
    return { success: true, licenseInfo, data: result };
  } catch (error: any) {
    console.error("Error activating license:", error);
    return { success: false, error: error.message };
  }
};

// Check license validity
export const checkLicenseValidity = async () => {
  const stored = getStoredLicense();
  if (!stored || !stored.licenseKey) {
    return { valid: false, error: "لا يوجد ترخيص مفعل" };
  }

  const deviceId = getDeviceId();

  try {
    const { data, error } = await supabase.rpc("check_license_validity", {
      p_license_key: stored.licenseKey,
      p_device_id: deviceId,
    });

    if (error) throw error;

    const result = data as unknown as LicenseValidityResult;

    if (result.valid) {
      // Update stored info
      stored.remainingDays = result.remaining_days;
      stored.isTrial = result.is_trial;
      storeLicense(stored);
    }

    return result;
  } catch (error: any) {
    console.error("Error checking license:", error);
    return { valid: false, error: error.message };
  }
};

// Generate new license (admin only)
export const generateLicense = async (
  schoolId: string,
  validityMonths: number,
  maxDevices: number
) => {
  try {
    const { data: licenseKey } = await supabase.rpc("generate_license_key");

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

    const { data: license, error } = await supabase
      .from("licenses")
      .insert({
        license_key: licenseKey,
        school_id: schoolId,
        is_trial: false,
        validity_months: validityMonths,
        start_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        max_devices: maxDevices,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, license, licenseKey };
  } catch (error: any) {
    console.error("Error generating license:", error);
    return { success: false, error: error.message };
  }
};

// Get all schools
export const getSchools = async () => {
  const { data, error } = await supabase
    .from("schools")
    .select("*, licenses(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get all licenses
export const getLicenses = async () => {
  const { data, error } = await supabase
    .from("licenses")
    .select("*, schools(*), device_activations(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Renew license
export const renewLicense = async (
  licenseId: string,
  additionalMonths: number
) => {
  try {
    const { data: license } = await supabase
      .from("licenses")
      .select("*")
      .eq("id", licenseId)
      .single();

    if (!license) throw new Error("License not found");

    const currentExpiry = license.expiry_date
      ? new Date(license.expiry_date)
      : new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + additionalMonths);

    const { error } = await supabase
      .from("licenses")
      .update({
        expiry_date: newExpiry.toISOString(),
        is_trial: false,
      })
      .eq("id", licenseId);

    if (error) throw error;

    return { success: true, newExpiry };
  } catch (error: any) {
    console.error("Error renewing license:", error);
    return { success: false, error: error.message };
  }
};

// Create school
export const createSchool = async (schoolData: {
  name: string;
  director_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) => {
  const { data, error } = await supabase
    .from("schools")
    .insert(schoolData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update school
export const updateSchool = async (
  schoolId: string,
  schoolData: {
    name?: string;
    director_name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }
) => {
  const { data, error } = await supabase
    .from("schools")
    .update(schoolData)
    .eq("id", schoolId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Deactivate device
export const deactivateDevice = async (deviceActivationId: string) => {
  const { error } = await supabase
    .from("device_activations")
    .update({ is_active: false })
    .eq("id", deviceActivationId);

  if (error) throw error;
  return { success: true };
};

// Delete license
export const deleteLicense = async (licenseId: string) => {
  try {
    // First deactivate all device activations for this license
    await supabase
      .from("device_activations")
      .update({ is_active: false })
      .eq("license_id", licenseId);

    // Then deactivate the license
    const { error } = await supabase
      .from("licenses")
      .update({ is_active: false })
      .eq("id", licenseId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting license:", error);
    return { success: false, error: error.message };
  }
};
