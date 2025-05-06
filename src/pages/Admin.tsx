
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom"; 
import { useToast } from "@/hooks/use-toast";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if admin is already logged in
  useEffect(() => {
    const adminLoggedIn = localStorage.getItem("adminLoggedIn");
    if (adminLoggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  
  // If logged in, redirect to admin dashboard
  if (isLoggedIn) {
    return <Navigate to="/admin-dashboard" />;
  }
  
  // If not logged in, show login form
  return <AdminLoginForm />;
};

export default Admin;
