
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import TestResults from "./pages/TestResults";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherLogin from "./pages/TeacherLogin";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/reports/:testId" element={<Reports />} />
      <Route path="/test-results" element={<TestResults />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/teacher-login" element={<TeacherLogin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
