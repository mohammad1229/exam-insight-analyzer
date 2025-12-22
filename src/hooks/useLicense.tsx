import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getStoredLicense,
  checkLicenseValidity,
  activateLicense as activateLicenseService,
  startTrial,
  storeLicense,
  clearLicense,
} from "@/services/licenseService";

interface LicenseState {
  isLoading: boolean;
  isActivated: boolean;
  isTrial: boolean;
  remainingDays: number;
  schoolId: string | null;
  schoolName: string | null;
  directorName: string | null;
  schoolLogo: string | null;
  licenseKey: string | null;
  devicesUsed: number;
  maxDevices: number;
  expiryDate: string | null;
  showExpiryWarning: boolean;
}

export const useLicense = () => {
  const { toast } = useToast();
  const [state, setState] = useState<LicenseState>({
    isLoading: true,
    isActivated: false,
    isTrial: false,
    remainingDays: 0,
    schoolId: null,
    schoolName: null,
    directorName: null,
    schoolLogo: null,
    licenseKey: null,
    devicesUsed: 0,
    maxDevices: 1,
    expiryDate: null,
    showExpiryWarning: false,
  });

  const checkLicense = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const stored = getStoredLicense();
      
      if (!stored || !stored.licenseKey) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isActivated: false,
        }));
        return;
      }

      // Check if device is already activated (skip online check if recently validated)
      const lastValidation = localStorage.getItem("lastLicenseValidation");
      const validationInterval = 24 * 60 * 60 * 1000; // 24 hours
      const now = Date.now();
      
      if (lastValidation && (now - parseInt(lastValidation)) < validationInterval) {
        // Use cached validation - device already activated
        const remainingDays = stored.remainingDays || 0;
        const showWarning = remainingDays <= 7 && remainingDays > 0;
        
        setState({
          isLoading: false,
          isActivated: true,
          isTrial: stored.isTrial || false,
          remainingDays: remainingDays,
          schoolId: stored.schoolId,
          schoolName: stored.schoolName,
          directorName: stored.directorName || null,
          schoolLogo: stored.schoolLogo || null,
          licenseKey: stored.licenseKey,
          devicesUsed: stored.devicesUsed || 0,
          maxDevices: stored.maxDevices || 1,
          expiryDate: stored.expiryDate || null,
          showExpiryWarning: showWarning,
        });
        return;
      }

      const result = await checkLicenseValidity();
      
      if (result.valid) {
        const remainingDays = (result as any).remaining_days;
        const isTrial = (result as any).is_trial;
        const devicesUsed = (result as any).devices_used;
        const maxDevices = (result as any).max_devices;
        
        const showWarning = remainingDays !== undefined && 
                           remainingDays <= 7 && 
                           remainingDays > 0;

        setState({
          isLoading: false,
          isActivated: true,
          isTrial: isTrial || false,
          remainingDays: remainingDays || 0,
          schoolId: stored.schoolId,
          schoolName: stored.schoolName,
          directorName: stored.directorName || null,
          schoolLogo: stored.schoolLogo || null,
          licenseKey: stored.licenseKey,
          devicesUsed: devicesUsed || 0,
          maxDevices: maxDevices || 1,
          expiryDate: stored.expiryDate || null,
          showExpiryWarning: showWarning,
        });

        // Save validation timestamp to avoid repeated checks
        localStorage.setItem("lastLicenseValidation", Date.now().toString());

        // Store school info in localStorage for other components
        if (stored.schoolName) {
          localStorage.setItem("licenseSchoolName", stored.schoolName);
        }
        if (stored.directorName) {
          localStorage.setItem("licenseDirectorName", stored.directorName);
        }

        // Show warning notification if expiring soon (only once per session)
        const warningShown = sessionStorage.getItem("licenseWarningShown");
        if (showWarning && !warningShown) {
          sessionStorage.setItem("licenseWarningShown", "true");
          toast({
            title: "تنبيه: اقتراب انتهاء الترخيص",
            description: `متبقي ${remainingDays} أيام على انتهاء الترخيص. يرجى التجديد قبل انتهاء الصلاحية.`,
            variant: "destructive",
          });
        }
      } else {
        // License invalid
        setState(prev => ({
          ...prev,
          isLoading: false,
          isActivated: false,
          remainingDays: 0,
        }));

        if (result.error) {
          toast({
            title: "مشكلة في الترخيص",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error checking license:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isActivated: false,
      }));
    }
  }, [toast]);

  const activateLicense = useCallback(async (licenseKey: string) => {
    try {
      const result = await activateLicenseService(licenseKey);
      
      if (result.success && result.licenseInfo) {
        const newState = {
          isLoading: false,
          isActivated: true,
          isTrial: result.licenseInfo.isTrial || false,
          remainingDays: result.licenseInfo.remainingDays || 0,
          schoolId: result.licenseInfo.schoolId || null,
          schoolName: result.licenseInfo.schoolName || null,
          directorName: result.licenseInfo.directorName || null,
          schoolLogo: result.licenseInfo.schoolLogo || null,
          licenseKey: result.licenseInfo.licenseKey,
          devicesUsed: result.licenseInfo.devicesUsed || 0,
          maxDevices: result.licenseInfo.maxDevices || 1,
          expiryDate: result.licenseInfo.expiryDate || null,
          showExpiryWarning: false,
        };
        
        setState(newState);

        // Store in localStorage for Welcome page and other components
        if (result.licenseInfo.schoolName) {
          localStorage.setItem("schoolName", result.licenseInfo.schoolName);
          localStorage.setItem("licenseSchoolName", result.licenseInfo.schoolName);
        }
        if (result.licenseInfo.directorName) {
          localStorage.setItem("directorName", result.licenseInfo.directorName);
          localStorage.setItem("licenseDirectorName", result.licenseInfo.directorName);
        }

        toast({
          title: "تم التنشيط بنجاح",
          description: `تم تنشيط النظام لـ ${result.licenseInfo.schoolName}`,
        });

        // Navigate to welcome page after activation
        window.location.href = "/welcome";

        return { success: true };
      } else {
        toast({
          title: "فشل التنشيط",
          description: result.error || "مفتاح الترخيص غير صالح",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التنشيط",
        description: error.message || "حدث خطأ أثناء تنشيط الترخيص",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const startTrialLicense = useCallback(async (schoolName: string) => {
    try {
      const result = await startTrial(schoolName);
      
      if (result.success && result.licenseInfo) {
        setState(prev => ({
          ...prev,
          isActivated: true,
          isTrial: true,
          remainingDays: 15,
          schoolId: result.licenseInfo.schoolId,
          schoolName: result.licenseInfo.schoolName,
          directorName: result.licenseInfo.directorName || null,
          schoolLogo: result.licenseInfo.schoolLogo || null,
          licenseKey: result.licenseInfo.licenseKey,
        }));

        toast({
          title: "تم بدء الفترة التجريبية",
          description: `مرحباً بك في ${schoolName}. لديك 15 يوم للتجربة.`,
        });

        return { success: true };
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في بدء الفترة التجريبية",
          variant: "destructive",
        });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء بدء الفترة التجريبية",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  }, [toast]);

  const logout = useCallback(() => {
    clearLicense();
    // Clear validation cache
    localStorage.removeItem("lastLicenseValidation");
    sessionStorage.removeItem("licenseWarningShown");
    
    setState({
      isLoading: false,
      isActivated: false,
      isTrial: false,
      remainingDays: 0,
      schoolId: null,
      schoolName: null,
      directorName: null,
      schoolLogo: null,
      licenseKey: null,
      devicesUsed: 0,
      maxDevices: 1,
      expiryDate: null,
      showExpiryWarning: false,
    });
  }, []);

  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  return {
    ...state,
    activateLicense,
    startTrialLicense,
    checkLicense,
    logout,
  };
};
