
import { Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import TestResults from "./pages/TestResults";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherLogin from "./pages/TeacherLogin";
import SystemAdmin from "./pages/SystemAdmin";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/:testId" element={<Reports />} />
      <Route path="/test-results" element={<TestResults />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="/system-admin" element={<SystemAdmin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
