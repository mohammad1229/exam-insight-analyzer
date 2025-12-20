import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeBackupScheduler } from "@/services/backupService";
import WisdomBanner from "@/components/WisdomBanner";
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

function App() {
  useEffect(() => {
    // Initialize automatic backup scheduler
    initializeBackupScheduler();
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
        <Toaster />
      </LicenseProvider>
    </ThemeProvider>
  );
}

export default App;
