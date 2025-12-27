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

// Generate unique hardware-based device ID that persists across sessions
export const getDeviceId = (): string => {
  // Check multiple storage locations for existing device ID
  let deviceId = localStorage.getItem("deviceId") || 
                 localStorage.getItem("hardware_device_id") ||
                 sessionStorage.getItem("deviceId");
  
  if (deviceId) {
    // Ensure it's stored in all locations for persistence
    localStorage.setItem("deviceId", deviceId);
    localStorage.setItem("hardware_device_id", deviceId);
    return deviceId;
  }

  // Generate hardware-like fingerprint using multiple browser properties
  const fingerprint = generateHardwareFingerprint();
  deviceId = `hw_${fingerprint}`;
  
  // Store in multiple locations for maximum persistence
  localStorage.setItem("deviceId", deviceId);
  localStorage.setItem("hardware_device_id", deviceId);
  
  return deviceId;
};

// Generate a stable fingerprint based on browser/hardware properties
const generateHardwareFingerprint = (): string => {
  const components: string[] = [];
  
  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  components.push(`${screen.pixelDepth}`);
  
  // Navigator properties
  components.push(navigator.language || 'unknown');
  components.push(navigator.platform || 'unknown');
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.maxTouchPoints || 0));
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown');
  
  // User agent hash
  const ua = navigator.userAgent || '';
  components.push(hashString(ua));
  
  // Canvas fingerprint (optional, for extra uniqueness)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      components.push(hashString(canvas.toDataURL()));
    }
  } catch (e) {
    components.push('no-canvas');
  }
  
  // Combine all components and hash
  const combined = components.join('|');
  return hashString(combined);
};

// Simple hash function for generating consistent IDs
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to base36 for shorter representation
  return Math.abs(hash).toString(36);
};

// Check if device is already activated (persistent check)
export const isDeviceActivated = (): boolean => {
  const activationData = localStorage.getItem("device_activation_status");
  if (!activationData) return false;
  
  try {
    const data = JSON.parse(activationData);
    const storedDeviceId = data.deviceId;
    const currentDeviceId = getDeviceId();
    
    // Check if same device and has valid license
    return storedDeviceId === currentDeviceId && data.isActivated === true;
  } catch {
    return false;
  }
};

// Mark device as permanently activated
export const markDeviceActivated = (licenseKey: string, schoolId: string): void => {
  const activationData = {
    deviceId: getDeviceId(),
    licenseKey,
    schoolId,
    isActivated: true,
    activatedAt: new Date().toISOString(),
    lastValidated: Date.now()
  };
  localStorage.setItem("device_activation_status", JSON.stringify(activationData));
};

// Get stored activation data
export const getDeviceActivationData = (): any => {
  const data = localStorage.getItem("device_activation_status");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
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
    
    // Mark device as permanently activated for trial
    markDeviceActivated(data.licenseKey, data.school.id);
    
    // Store school name in localStorage for Welcome page
    localStorage.setItem("schoolName", schoolName);
    localStorage.setItem("directorName", "");
    localStorage.setItem("currentSchoolId", data.school.id);
    localStorage.setItem("lastLicenseValidation", Date.now().toString());
    
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

    // Get license + school details via backend function (licenses/schools are service-role protected)
    const detailsResp = await supabase.functions.invoke("get-license-details", {
      body: { licenseKey },
    });

    if (detailsResp.error) throw detailsResp.error;
    if (!detailsResp.data?.success) {
      return { success: false, error: detailsResp.data?.error || "تعذر جلب بيانات الترخيص" };
    }

    const license = detailsResp.data.data as any;

    const licenseInfo = {
      licenseKey,
      schoolId: license?.school_id,
      schoolName: license?.schools?.name || "",
      directorName: license?.schools?.director_name || "",
      schoolLogo: license?.schools?.logo_url || "",
      isTrial: result.is_trial,
      remainingDays: result.remaining_days,
      devicesUsed: result.devices_used,
      maxDevices: result.max_devices,
      expiryDate: license?.expiry_date,
    };

    storeLicense(licenseInfo);

    // Mark device as permanently activated
    markDeviceActivated(licenseKey, licenseInfo.schoolId || '');

    // Store school data in localStorage for UI components
    localStorage.setItem("schoolName", licenseInfo.schoolName);
    localStorage.setItem("directorName", licenseInfo.directorName);
    localStorage.setItem("schoolLogo", licenseInfo.schoolLogo);
    localStorage.setItem("currentSchoolId", licenseInfo.schoolId || "");
    localStorage.setItem("licenseSchoolName", licenseInfo.schoolName);
    localStorage.setItem("licenseDirectorName", licenseInfo.directorName);
    
    // Save validation timestamp
    localStorage.setItem("lastLicenseValidation", Date.now().toString());
    
    // Initialize school data in database if this is first activation
    if (licenseInfo.schoolId) {
      try {
        await supabase.functions.invoke('school-data', {
          body: { action: 'initializeSchoolData', schoolId: licenseInfo.schoolId, data: {} }
        });
        console.log(`Initialized school data for: ${licenseInfo.schoolId}`);
      } catch (initError) {
        console.log('School data already initialized or init skipped:', initError);
      }
    }
    
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
        // Fetch latest school info via backend function (service-role protected tables)
        const detailsResp = await supabase.functions.invoke("get-license-details", {
          body: { licenseKey: stored.licenseKey },
        });

        if (!detailsResp.error && detailsResp.data?.success && detailsResp.data.data) {
          const license = detailsResp.data.data as any;

          // Update stored info with latest data
          stored.remainingDays = result.remaining_days;
          stored.isTrial = result.is_trial;
          stored.schoolName = license?.schools?.name || stored.schoolName;
          stored.directorName = license?.schools?.director_name || stored.directorName;
          stored.schoolLogo = license?.schools?.logo_url || stored.schoolLogo || "";
          stored.schoolId = license?.school_id || stored.schoolId;
          storeLicense(stored);

          // Update localStorage for UI components
          localStorage.setItem("schoolName", stored.schoolName || "");
          localStorage.setItem("directorName", stored.directorName || "");
          localStorage.setItem("schoolLogo", stored.schoolLogo || "");
          localStorage.setItem("currentSchoolId", stored.schoolId || "");
          localStorage.setItem("licenseSchoolName", stored.schoolName || "");
          localStorage.setItem("licenseDirectorName", stored.directorName || "");
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

// Initialize database for a new school - now uses Supabase
export const initializeSchoolDatabase = async (schoolId: string, schoolName: string, directorName: string, withDefaults: boolean = true) => {
  // Initialize in Supabase via edge function
  if (withDefaults) {
    try {
      await supabase.functions.invoke('school-data', {
        body: { action: 'initializeSchoolData', schoolId, data: {} }
      });
      console.log(`Initialized database in Supabase for school: ${schoolId}`);
    } catch (error) {
      console.error('Error initializing school data in Supabase:', error);
    }
  }

  // Also keep localStorage for backward compatibility (will be migrated)
  const defaults = withDefaults ? getDefaultSchoolData() : { classes: [], subjects: [], performanceLevels: [] };
  
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

  Object.entries(schoolData).forEach(([key, value]) => {
    const storageKey = `${schoolId}_${key}`;
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
  // Use plain text password (no encryption)
  const passwordHash = adminData.password;

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
  
  // If password is being updated, use plain text (no encryption)
  if (updates.password) {
    updateData.password_hash = updates.password;
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

// Verify school admin login using edge function (service role)
export const verifySchoolAdminLogin = async (username: string, password: string) => {
  try {
    // Get the activated license ID from localStorage to verify admin belongs to this license
    const activatedLicenseId = localStorage.getItem("currentLicenseId");
    
    const { data, error } = await supabase.functions.invoke('get-admin-data', {
      body: { 
        action: 'verifySchoolAdminLogin', 
        username, 
        password,
        activatedLicenseId 
      }
    });

    if (error) throw error;
    
    if (!data || !data.success) {
      return { success: false, error: data?.error || 'خطأ في تسجيل الدخول' };
    }

    return { 
      success: true,
      must_change_password: data.must_change_password || data.admin?.must_change_password,
      admin: {
        id: data.admin.id,
        full_name: data.admin.full_name,
        username: data.admin.username,
        email: data.admin.email,
        phone: data.admin.phone,
        school_id: data.admin.school_id,
        license_id: data.admin.license_id,
        role: data.admin.role || 'school_admin',
        must_change_password: data.admin.must_change_password,
        schools: {
          name: data.admin.school_name,
          director_name: data.admin.director_name,
          logo_url: data.admin.logo_url
        },
        licenses: {
          license_key: data.admin.license_key,
          is_active: data.admin.license_active,
          expiry_date: data.admin.expiry_date
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
