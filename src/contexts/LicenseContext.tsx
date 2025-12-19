import { createContext, useContext, ReactNode } from "react";
import { useLicense } from "@/hooks/useLicense";

interface LicenseContextType {
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
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  startTrialLicense: (schoolName: string) => Promise<{ success: boolean; error?: string }>;
  checkLicense: () => Promise<void>;
  logout: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider = ({ children }: { children: ReactNode }) => {
  const license = useLicense();

  return (
    <LicenseContext.Provider value={license}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicenseContext = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error("useLicenseContext must be used within a LicenseProvider");
  }
  return context;
};
