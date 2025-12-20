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
    // Use edge function to create school and license
    const { data, error } = await supabase.functions.invoke('create-license', {
      body: { 
        schoolName, 
        directorName: "",
        validityMonths: 0,
        maxDevices: 1,
        isTrial: true
      }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    const licenseInfo = {
      licenseKey: data.licenseKey,
      schoolId: data.school.id,
      schoolName,
      directorName: "",
      schoolLogo: "",
      isTrial: true,
      remainingDays: 15,
      startDate: new Date().toISOString(),
    };

    storeLicense(licenseInfo);
    
    // Store school name in localStorage for Welcome page
    localStorage.setItem("schoolName", schoolName);
    localStorage.setItem("directorName", "");
    localStorage.setItem("currentSchoolId", data.school.id);
    
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
      schoolLogo: (license?.schools as any)?.logo_url || "",
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
        stored.schoolLogo = (license.schools as any)?.logo_url || stored.schoolLogo || "";
        stored.schoolId = license.school_id || stored.schoolId;
        storeLicense(stored);

        // Update localStorage for UI components
        localStorage.setItem("schoolName", stored.schoolName || "");
        localStorage.setItem("directorName", stored.directorName || "");
        localStorage.setItem("schoolLogo", stored.schoolLogo || "");
        localStorage.setItem("currentSchoolId", stored.schoolId || "");
      }
    }

    return result;
  } catch (error: any) {
    console.error("Error checking license:", error);
    return { valid: false, error: error.message };
  }
};

// Generate new license (admin only) - uses edge function
export const generateLicense = async (
  schoolId: string,
  validityMonths: number,
  maxDevices: number
) => {
  try {
    // This function is kept for backward compatibility
    // New license creation should go through createLicenseWithSchool
    const { data, error } = await supabase.functions.invoke('manage-license', {
      body: { action: 'create', schoolId, validityMonths, maxDevices }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return { success: true, license: data.license, licenseKey: data.licenseKey };
  } catch (error: any) {
    console.error("Error generating license:", error);
    return { success: false, error: error.message };
  }
};

// Create license with new school (admin only) - uses edge function
export const createLicenseWithSchool = async (
  schoolName: string,
  directorName: string,
  validityMonths: number,
  maxDevices: number,
  email?: string,
  phone?: string,
  address?: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-license', {
      body: { schoolName, directorName, validityMonths, maxDevices, email, phone, address }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return { 
      success: true, 
      school: data.school, 
      license: data.license, 
      licenseKey: data.licenseKey 
    };
  } catch (error: any) {
    console.error("Error creating license:", error);
    return { success: false, error: error.message };
  }
};

// Get all schools - uses edge function to bypass RLS
export const getSchools = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-admin-data', {
      body: { action: 'getSchools' }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data.data;
  } catch (error: any) {
    console.error("Error getting schools:", error);
    return [];
  }
};

// Get all licenses - uses edge function to bypass RLS
export const getLicenses = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-admin-data', {
      body: { action: 'getLicenses' }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data.data;
  } catch (error: any) {
    console.error("Error getting licenses:", error);
    return [];
  }
};

// Renew license - uses edge function
export const renewLicense = async (
  licenseId: string,
  additionalMonths: number
) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-license', {
      body: { action: 'renew', licenseId, renewMonths: additionalMonths }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return { success: true, newExpiry: data.newExpiry };
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

// Create school - uses edge function
export const createSchool = async (schoolData: {
  name: string;
  director_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}) => {
  // Use createLicenseWithSchool for creating schools with licenses
  const result = await createLicenseWithSchool(
    schoolData.name,
    schoolData.director_name || "",
    12, // default 12 months
    1,  // default 1 device
    schoolData.email,
    schoolData.phone,
    schoolData.address
  );

  if (!result.success) throw new Error(result.error);

  // Initialize database with default data for the new school
  initializeSchoolDatabase(result.school.id, schoolData.name, schoolData.director_name || "", true);

  return result.school;
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

// Get all school admins - uses edge function to bypass RLS
export const getSchoolAdmins = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-admin-data', {
      body: { action: 'getSchoolAdmins' }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    return data.data;
  } catch (error: any) {
    console.error("Error getting school admins:", error);
    return [];
  }
};

// Create school admin with secure password hashing - uses edge function
export const createSchoolAdmin = async (adminData: {
  school_id: string;
  license_id?: string;
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
}) => {
  // Hash password using edge function for bcrypt
  const hashResponse = await supabase.functions.invoke('hash-password', {
    body: { password: adminData.password }
  });

  if (hashResponse.error) {
    throw new Error('فشل في تشفير كلمة المرور');
  }

  const passwordHash = hashResponse.data?.hash;
  
  if (!passwordHash) {
    throw new Error('فشل في تشفير كلمة المرور');
  }

  // Use edge function to create admin
  const { data, error } = await supabase.functions.invoke('get-admin-data', {
    body: { 
      action: 'createSchoolAdmin',
      adminData,
      passwordHash
    }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data.data;
};

// Update school admin with secure password hashing - uses edge function
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
  
  // If password is being updated, hash it securely using edge function
  if (updates.password) {
    const hashResponse = await supabase.functions.invoke('hash-password', {
      body: { password: updates.password }
    });

    if (hashResponse.error) {
      throw new Error('فشل في تشفير كلمة المرور');
    }

    updateData.password_hash = hashResponse.data?.hash;
    delete updateData.password;
  }

  // Use edge function to update admin
  const { data, error } = await supabase.functions.invoke('get-admin-data', {
    body: { 
      action: 'updateSchoolAdmin',
      adminId,
      updateData
    }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return data.data;
};

// Delete school admin - uses edge function
export const deleteSchoolAdmin = async (adminId: string) => {
  const { data, error } = await supabase.functions.invoke('get-admin-data', {
    body: { 
      action: 'deleteSchoolAdmin',
      adminId
    }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return { success: true };
};

// Verify school admin login using secure database function
export const verifySchoolAdminLogin = async (username: string, password: string) => {
  try {
    const { data, error } = await supabase.rpc('verify_admin_login', {
      p_username: username,
      p_password: password
    });

    if (error) throw error;
    
    const result = data as { 
      success: boolean; 
      error?: string; 
      must_change_password?: boolean;
      admin?: any 
    };
    
    if (!result || !result.success) {
      return { success: false, error: result?.error || 'خطأ في تسجيل الدخول' };
    }

    return { 
      success: true,
      must_change_password: result.must_change_password || result.admin?.must_change_password,
      admin: {
        id: result.admin.id,
        full_name: result.admin.full_name,
        username: result.admin.username,
        email: result.admin.email,
        phone: result.admin.phone,
        school_id: result.admin.school_id,
        license_id: result.admin.license_id,
        role: result.admin.role || 'school_admin',
        must_change_password: result.admin.must_change_password,
        schools: {
          name: result.admin.school_name,
          director_name: result.admin.director_name,
          logo_url: result.admin.logo_url
        },
        licenses: {
          license_key: result.admin.license_key,
          is_active: result.admin.license_active,
          expiry_date: result.admin.expiry_date
        }
      }
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
  }
};

// Delete/Deactivate license - uses edge function
export const deleteLicense = async (licenseId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('manage-license', {
      body: { action: 'deactivate', licenseId }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting license:", error);
    return { success: false, error: error.message };
  }
};
