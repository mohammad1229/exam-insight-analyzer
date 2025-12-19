
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { verifySchoolAdminLogin } from "@/services/licenseService";
import { Loader2, ArrowRight } from "lucide-react";

interface AdminLoginFormProps {
  onLoginSuccess?: () => void;
}

const AdminLoginForm = ({ onLoginSuccess }: AdminLoginFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        // Store admin session securely
        localStorage.setItem("schoolAdminId", result.admin.id);
        localStorage.setItem("schoolAdminName", result.admin.full_name);
        if (result.admin.school_id) {
          localStorage.setItem("currentSchoolId", result.admin.school_id);
        }
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.admin.full_name}`,
        });
        
        // Call the callback to update parent state
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
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

  const handleBackToMain = () => {
    navigate("/");
  };

  return (
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
  );
};

export default AdminLoginForm;
