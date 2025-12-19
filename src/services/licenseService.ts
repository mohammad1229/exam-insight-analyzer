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
      // Fetch latest school info from database
      const { data: license } = await supabase
        .from("licenses")
        .select("*, schools(*)")
        .eq("license_key", stored.licenseKey)
        .maybeSingle();

      if (license) {
        // Update stored info with latest data from database
        stored.remainingDays = result.remaining_days;
        stored.isTrial = result.is_trial;
        stored.schoolName = (license.schools as any)?.name || stored.schoolName;
        stored.directorName = (license.schools as any)?.director_name || stored.directorName;
        stored.schoolId = license.school_id || stored.schoolId;
        storeLicense(stored);

        // Update localStorage for UI components
        localStorage.setItem("schoolName", stored.schoolName || "");
        localStorage.setItem("directorName", stored.directorName || "");
        localStorage.setItem("currentSchoolId", stored.schoolId || "");
      }
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

// Default data for new schools
const getDefaultSchoolData = () => ({
  classes: [
    { id: "c1", name: "الصف الأول", sections: [{ id: "s1c1", name: "أ" }, { id: "s2c1", name: "ب" }] },
    { id: "c2", name: "الصف الثاني", sections: [{ id: "s1c2", name: "أ" }, { id: "s2c2", name: "ب" }] },
    { id: "c3", name: "الصف الثالث", sections: [{ id: "s1c3", name: "أ" }, { id: "s2c3", name: "ب" }] },
    { id: "c4", name: "الصف الرابع", sections: [{ id: "s1c4", name: "أ" }, { id: "s2c4", name: "ب" }] },
    { id: "c5", name: "الصف الخامس", sections: [{ id: "s1c5", name: "أ" }, { id: "s2c5", name: "ب" }] },
    { id: "c6", name: "الصف السادس", sections: [{ id: "s1c6", name: "أ" }, { id: "s2c6", name: "ب" }] },
    { id: "c7", name: "الصف السابع", sections: [{ id: "s1c7", name: "أ" }, { id: "s2c7", name: "ب" }] },
    { id: "c8", name: "الصف الثامن", sections: [{ id: "s1c8", name: "أ" }, { id: "s2c8", name: "ب" }] },
    { id: "c9", name: "الصف التاسع", sections: [{ id: "s1c9", name: "أ" }, { id: "s2c9", name: "ب" }] },
    { id: "c10", name: "الصف العاشر", sections: [{ id: "s1c10", name: "أ" }, { id: "s2c10", name: "ب" }] },
  ],
  subjects: [
    { id: "sub1", name: "الرياضيات" },
    { id: "sub2", name: "العلوم" },
    { id: "sub3", name: "اللغة العربية" },
    { id: "sub4", name: "اللغة الإنجليزية" },
    { id: "sub5", name: "التربية الإسلامية" },
    { id: "sub6", name: "الدراسات الاجتماعية" },
    { id: "sub7", name: "التربية الوطنية" },
    { id: "sub8", name: "الحاسوب" },
  ],
  performanceLevels: [
    { id: "lvl1", name: "متفوق", minScore: 90, maxScore: 100, color: "#22c55e" },
    { id: "lvl2", name: "جيد جداً", minScore: 80, maxScore: 89, color: "#3b82f6" },
    { id: "lvl3", name: "جيد", minScore: 70, maxScore: 79, color: "#eab308" },
    { id: "lvl4", name: "مقبول", minScore: 60, maxScore: 69, color: "#f97316" },
    { id: "lvl5", name: "ضعيف", minScore: 50, maxScore: 59, color: "#ef4444" },
    { id: "lvl6", name: "راسب", minScore: 0, maxScore: 49, color: "#991b1b" },
  ]
});

// Initialize empty database for a new school
export const initializeSchoolDatabase = (schoolId: string, schoolName: string, directorName: string, withDefaults: boolean = true) => {
  const defaults = withDefaults ? getDefaultSchoolData() : { classes: [], subjects: [], performanceLevels: [] };
  
  // Create data structures for the new school
  const schoolData = {
    students: [],
    classes: defaults.classes,
    subjects: defaults.subjects,
    teachers: [],
    tests: [],
    performanceLevels: defaults.performanceLevels,
    school: {
      id: schoolId,
      name: schoolName,
      director_name: directorName,
      logo: "",
      address: "",
      phone: "",
      email: ""
    }
  };

  // Save data with school ID prefix
  Object.entries(schoolData).forEach(([key, value]) => {
    const storageKey = `${schoolId}_${key}`;
    // Only initialize if not already exists
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  });

  console.log(`Initialized database for school: ${schoolId} (with defaults: ${withDefaults})`);
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

  // Initialize database with default data for the new school
  initializeSchoolDatabase(data.id, schoolData.name, schoolData.director_name || "", true);

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

// School Admins Management
export interface SchoolAdmin {
  id: string;
  school_id: string;
  license_id: string | null;
  username: string;
  password_hash: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  schools?: { name: string; director_name: string | null };
  licenses?: { license_key: string; is_active: boolean };
}

// Get all school admins
export const getSchoolAdmins = async () => {
  const { data, error } = await supabase
    .from("school_admins")
    .select("*, schools(name, director_name), licenses(license_key, is_active)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Create school admin
export const createSchoolAdmin = async (adminData: {
  school_id: string;
  license_id?: string;
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
}) => {
  // Simple hash for demo - in production use proper hashing
  const password_hash = btoa(adminData.password);

  const { data, error } = await supabase
    .from("school_admins")
    .insert({
      school_id: adminData.school_id,
      license_id: adminData.license_id || null,
      username: adminData.username,
      password_hash,
      full_name: adminData.full_name,
      email: adminData.email || null,
      phone: adminData.phone || null,
    })
    .select("*, schools(name, director_name), licenses(license_key, is_active)")
    .single();

  if (error) throw error;
  return data;
};

// Update school admin
export const updateSchoolAdmin = async (
  adminId: string,
  updates: {
    username?: string;
    password?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    is_active?: boolean;
    school_id?: string;
    license_id?: string;
  }
) => {
  const updateData: any = { ...updates };
  
  // If password is being updated, hash it
  if (updates.password) {
    updateData.password_hash = btoa(updates.password);
    delete updateData.password;
  }

  const { data, error } = await supabase
    .from("school_admins")
    .update(updateData)
    .eq("id", adminId)
    .select("*, schools(name, director_name), licenses(license_key, is_active)")
    .single();

  if (error) throw error;
  return data;
};

// Delete school admin
export const deleteSchoolAdmin = async (adminId: string) => {
  const { error } = await supabase
    .from("school_admins")
    .delete()
    .eq("id", adminId);

  if (error) throw error;
  return { success: true };
};

// Verify school admin login
export const verifySchoolAdminLogin = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from("school_admins")
    .select("*, schools(name, director_name), licenses(license_key, is_active, expiry_date)")
    .eq("username", username)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { success: false, error: "اسم المستخدم غير موجود" };

  // Verify password
  const hashedPassword = btoa(password);
  if (data.password_hash !== hashedPassword) {
    return { success: false, error: "كلمة المرور غير صحيحة" };
  }

  // Update last login
  await supabase
    .from("school_admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.id);

  return { success: true, admin: data };
};

// Delete license completely
export const deleteLicense = async (licenseId: string) => {
  try {
    // First delete all device activations for this license
    const { error: deviceError } = await supabase
      .from("device_activations")
      .delete()
      .eq("license_id", licenseId);

    if (deviceError) {
      console.error("Error deleting device activations:", deviceError);
    }

    // Then delete the license
    const { error } = await supabase
      .from("licenses")
      .delete()
      .eq("id", licenseId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting license:", error);
    return { success: false, error: error.message };
  }
};
