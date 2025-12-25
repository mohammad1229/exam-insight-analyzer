import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifySchoolAdminLogin } from "@/services/licenseService";
import { initializeBackupScheduler } from "@/services/backupService";
import { Loader2, ArrowRight, Key } from "lucide-react";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { saveLastUser } from "@/pages/Index";

interface AdminLoginFormProps {
  onLoginSuccess?: () => void;
}

const AdminLoginForm = ({ onLoginSuccess }: AdminLoginFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pendingAdminId, setPendingAdminId] = useState<string | null>(null);
  const [pendingAdminData, setPendingAdminData] = useState<any>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifySchoolAdminLogin(username.trim(), password);
      
      if (result.success && result.admin) {
        // Check if must change password
        if (result.must_change_password || result.admin.must_change_password) {
          setPendingAdminId(result.admin.id);
          setPendingAdminData(result.admin);
          setShowPasswordChange(true);
          setIsLoading(false);
          return;
        }
        
        completeLogin(result.admin);
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: result.error || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = (admin: any) => {
    // Verify admin has school and license
    if (!admin.school_id) {
      toast({
        title: "خطأ",
        description: "المستخدم غير مرتبط بمدرسة",
        variant: "destructive",
      });
      return;
    }

    // Store admin session
    localStorage.setItem("schoolAdminId", admin.id);
    localStorage.setItem("schoolAdminName", admin.full_name);
    localStorage.setItem("adminRole", admin.role || "school_admin");
    localStorage.setItem("currentSchoolId", admin.school_id);
    if (admin.license_id) {
      localStorage.setItem("currentLicenseId", admin.license_id);
    }

    // Store admin data for backup service
    localStorage.setItem("currentAdminData", JSON.stringify({
      id: admin.id,
      school_id: admin.school_id,
      license_id: admin.license_id,
      school_name: admin.school_name || admin.schools?.name,
      full_name: admin.full_name,
      loginTime: new Date().toISOString()
    }));

    // Initialize backup scheduler for school admin
    initializeBackupScheduler();

    // Save last logged in user
    saveLastUser({
      name: admin.full_name,
      type: 'admin',
      timestamp: new Date().toISOString()
    });
    
    toast({
      title: "تم تسجيل الدخول بنجاح",
      description: `مرحباً بك ${admin.full_name}`,
    });
    
    // Call the callback to update parent state
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChange(false);
    if (pendingAdminData) {
      completeLogin(pendingAdminData);
    }
    setPendingAdminId(null);
    setPendingAdminData(null);
  };

  const handleBackToMain = () => {
    navigate("/");
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-black via-white to-green-600 dir-rtl">
        <Card className="w-[350px] border-2 border-[#ea384c]">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-center text-2xl">تسجيل دخول مدير المدرسة</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 mt-2">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="mt-2 bg-[#ea384c] hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBackToMain}
                  className="border-gray-400 text-gray-700 hover:bg-gray-100"
                >
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة للشاشة الرئيسية
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forced Password Change Dialog */}
      {pendingAdminId && (
        <ChangePasswordDialog
          open={showPasswordChange}
          adminId={pendingAdminId}
          isForced={true}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </>
  );
};

export default AdminLoginForm;
