
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";

const TeacherLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [trialDaysLeft, setTrialDaysLeft] = useState(10);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState("");

  useEffect(() => {
    // Check activation status
    checkActivationStatus();
  }, []);

  const checkActivationStatus = async () => {
    try {
      if (isElectron()) {
        const settings = await electronService.getSystemSettings();
        const activated = settings.systemActivated === "true";
        setIsActivated(activated);
        
        if (!activated) {
          const installDate = settings.installDate || new Date().toISOString();
          const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
          setTrialDaysLeft(Math.max(0, 10 - daysElapsed));
        }
      } else {
        const activated = localStorage.getItem("systemActivated") === "true";
        setIsActivated(activated);
        
        if (!activated) {
          const installDate = localStorage.getItem("installDate");
          if (installDate) {
            const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
            setTrialDaysLeft(Math.max(0, 10 - daysElapsed));
          } else {
            // First time using the app
            localStorage.setItem("installDate", new Date().toISOString());
            localStorage.setItem("trialDaysLeft", "10");
          }
        }
      }
    } catch (error) {
      console.error("Error checking activation status:", error);
    }
  };

  const handleActivation = async () => {
    if (!activationKey) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مفتاح التنشيط",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      
      if (isElectron()) {
        result = await electronService.activateLicense(activationKey);
      } else {
        // Web environment
        const licenses = JSON.parse(localStorage.getItem("licenseKeys") || "[]");
        const license = licenses.find((l: any) => l.key === activationKey && !l.used);

        if (license) {
          // Activate the system
          localStorage.setItem("systemActivated", "true");
          localStorage.setItem("schoolName", license.schoolName);
          localStorage.setItem("directorName", license.directorName);
          localStorage.setItem("activationDate", new Date().toISOString());
          localStorage.setItem("expiryDate", license.validUntil);

          // Mark license as used
          license.used = true;
          localStorage.setItem("licenseKeys", JSON.stringify(licenses));

          result = {
            success: true,
            message: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
            license
          };
        } else {
          result = {
            success: false,
            message: "مفتاح التنشيط غير صالح أو مستخدم بالفعل"
          };
        }
      }

      if (result.success) {
        setIsActivated(true);
        toast({
          title: "تم التنشيط بنجاح",
          description: result.message,
        });
      } else {
        toast({
          title: "فشل التنشيط",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during activation:", error);
      toast({
        title: "خطأ في التنشيط",
        description: "حدث خطأ أثناء محاولة تنشيط النظام",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async () => {
    // First check if system is activated or still in trial period
    if (!isActivated && trialDaysLeft <= 0) {
      toast({
        title: "انتهت الفترة التجريبية",
        description: "يرجى تنشيط النظام للاستمرار",
        variant: "destructive",
      });
      return;
    }

    try {
      let teachers = [];
      
      if (isElectron()) {
        teachers = await electronService.db.getAll("teachers");
      } else {
        // Get teachers with credentials from localStorage
        const teachersString = localStorage.getItem("teachersWithCredentials");
        if (!teachersString) {
          toast({
            title: "خطأ في النظام",
            description: "لم يتم العثور على بيانات المعلمين",
            variant: "destructive",
          });
          return;
        }
        
        teachers = JSON.parse(teachersString);
      }
      
      const teacher = teachers.find(
        (t: any) => t.username === username && t.password === password
      );
      
      if (teacher) {
        // Store teacher info in localStorage for session management
        localStorage.setItem("loggedInTeacher", JSON.stringify({
          id: teacher.id,
          name: teacher.name,
          assignedClasses: teacher.assignedClasses,
          assignedSubjects: teacher.assignedSubjects
        }));
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${teacher.name}`,
        });
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "حدث خطأ أثناء محاولة تسجيل الدخول",
        variant: "destructive",
      });
    }
  };

  // If trial expired and not activated
  if (!isActivated && trialDaysLeft <= 0) {
    return (
      <div 
        className="flex min-h-screen flex-col palestine-gradient"
      >
        <div className="absolute top-0 left-0 right-0 h-16 bg-black text-white shadow-sm flex items-center justify-center">
          <div className="container flex justify-between items-center">
            <h1 className="text-2xl font-bold">نظام إدارة اختبارات المدرسة</h1>
            <div className="space-x-2">
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black"
                onClick={() => navigate("/")}
              >
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center w-full dir-rtl">
          <Card className="palestine-card w-[450px]">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-center text-2xl">انتهت الفترة التجريبية</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 mt-2">
              <div className="text-center mb-6">
                <p className="text-red-600 font-bold">لقد انتهت الفترة التجريبية للنظام</p>
                <p className="text-gray-600 mt-2">يرجى تفعيل النظام باستخدام مفتاح التنشيط للاستمرار</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="activationKey">مفتاح التنشيط</Label>
                  <Input
                    id="activationKey"
                    type="text"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                  />
                </div>
                
                <Button 
                  onClick={handleActivation}
                  className="palestine-button-primary w-full mt-2"
                >
                  تنشيط النظام
                </Button>
                
                <div className="text-sm text-center text-muted-foreground mt-4">
                  للحصول على مفتاح تنشيط، يرجى التواصل مع مسؤول النظام
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Normal login view
  return (
    <div 
      className="flex min-h-screen flex-col palestine-gradient"
    >
      <div className="absolute top-0 left-0 right-0 h-16 bg-black text-white shadow-sm flex items-center justify-center">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">نظام إدارة اختبارات المدرسة</h1>
          <div className="space-x-2">
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black"
              onClick={() => navigate("/")}
            >
              الصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center w-full dir-rtl">
        <Card className="palestine-card w-[450px]">
          <CardHeader className="bg-black text-white">
            <CardTitle className="text-center text-2xl">تسجيل دخول المعلم</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 mt-2">
            {!isActivated && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  أنت في الفترة التجريبية. متبقي {trialDaysLeft} يوم.
                </p>
              </div>
            )}
            
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
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="palestine-button-primary mt-2"
                >
                  تسجيل الدخول
                </Button>
                <div className="text-sm text-center text-muted-foreground mt-4">
                  للتسجيل كمعلم، يرجى التواصل مع مدير المدرسة
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherLogin;
