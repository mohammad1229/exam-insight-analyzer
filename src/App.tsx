import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeBackupScheduler } from "@/services/backupService";
import { setupAutoSync, syncPendingOperations, isOnline } from "@/services/offlineSyncService";
import { initHybridStorage, syncPendingChanges } from "@/services/hybridStorageService";
import { recoverSessionFromDeviceActivation } from "@/services/licenseService";
import WisdomBanner from "@/components/WisdomBanner";
import OfflineIndicator from "@/components/OfflineIndicator";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import TestResults from "./pages/TestResults";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherLogin from "./pages/TeacherLogin";
import SystemAdmin from "./pages/SystemAdmin";
import SchoolStatistics from "./pages/SchoolStatistics";
import NotFound from "./pages/NotFound";
import { toast } from "sonner";

function App() {
  useEffect(() => {
    // Recover school/license context if localStorage was cleared
    (async () => {
      const res = await recoverSessionFromDeviceActivation();
      if (res.recovered && !res.offlineOnly) {
        toast.success("تم استعادة بيانات الترخيص تلقائياً");
      }
    })();

    // Initialize automatic backup scheduler
    initializeBackupScheduler();
    
    // Initialize hybrid storage (local + cloud) automatically
    initHybridStorage().then(() => {
      console.log('Hybrid storage initialized');
      // Sync pending changes on app start
      if (navigator.onLine) {
        syncPendingChanges().then(result => {
          if (result.success > 0) {
            console.log(`Synced ${result.success} pending changes`);
          }
        });
      }
    });
    
    // Setup offline sync
    const cleanupSync = setupAutoSync((result) => {
      if (result.synced > 0) {
        toast.success(`تم مزامنة ${result.synced} عملية محفوظة`);
      }
    });
    
    // Try to sync pending operations on app start if online
    if (isOnline()) {
      syncPendingOperations();
    }
    
    // Auto-sync hybrid storage every 5 minutes
    const hybridSyncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingChanges();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      cleanupSync();
      clearInterval(hybridSyncInterval);
    };
  }, []);

  // Check if we should show wisdom banner (not on index/welcome pages)
  const shouldShowWisdomBanner = () => {
    const path = window.location.pathname;
    return path !== "/" && path !== "/welcome" && path !== "/system-admin";
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LicenseProvider>
        {shouldShowWisdomBanner() && <WisdomBanner />}
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:testId" element={<Reports />} />
          <Route path="/test-results" element={<TestResults />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/teacher-login" element={<TeacherLogin />} />
          <Route path="/system-admin" element={<SystemAdmin />} />
          <Route path="/statistics" element={<SchoolStatistics />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <OfflineIndicator />
        <Toaster />
      </LicenseProvider>
    </ThemeProvider>
  );
}

export default App;
