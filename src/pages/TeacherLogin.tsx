import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";
import { LogIn } from "lucide-react";
import TeacherChangePasswordDialog from "@/components/TeacherChangePasswordDialog";
import { saveLastUser } from "@/pages/Index";

const TeacherLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [trialDaysLeft, setTrialDaysLeft] = useState(10);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState("");

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [pendingTeacherId, setPendingTeacherId] = useState<string | null>(null);
  const [pendingTeacherName, setPendingTeacherName] = useState("");

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

    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    try {
      let teacher: any = null;

      if (isElectron()) {
        const teachers = await electronService.db.getAll("teachers");
        teacher = teachers.find((t: any) => t.username === username && t.password === password);
      } else {
        // Use database (Lovable Cloud) verification
        const { verifyTeacherLoginDB } = await import("@/services/databaseService");
        const result = await verifyTeacherLoginDB(username, password);
        teacher = result.success ? result.teacher : null;

        if (!result.success) {
          toast({
            title: "فشل تسجيل الدخول",
            description: result.error || "اسم المستخدم أو كلمة المرور غير صحيحة",
            variant: "destructive",
          });
          return;
        }
      }

      if (teacher) {
        // Get classes, subjects, and sections from the API response
        const teacherClasses = teacher.classes || [];
        const teacherSubjects = teacher.subjects || [];
        const teacherSections = teacher.sections || [];
        
        console.log("Teacher login - classes:", teacherClasses);
        console.log("Teacher login - subjects:", teacherSubjects);
        console.log("Teacher login - sections:", teacherSections);
        
        // Store teacher info before checking password change
        localStorage.setItem(
          "loggedInTeacher",
          JSON.stringify({
            id: teacher.id,
            name: teacher.name,
            school_id: teacher.school_id,
            license_id: teacher.license_id,
            // Store both naming conventions for compatibility
            classes: teacherClasses,
            subjects: teacherSubjects,
            sections: teacherSections,
            assignedClasses: teacherClasses,
            assignedSubjects: teacherSubjects,
            assignedSections: teacherSections,
            role: teacher.role || "teacher",
          })
        );
        localStorage.setItem("currentTeacherId", teacher.id);
        localStorage.setItem("currentSchoolId", teacher.school_id);

        // Check if must change password
        if (teacher.must_change_password) {
          setPendingTeacherId(teacher.id);
          setPendingTeacherName(teacher.name);
          setShowPasswordChange(true);
          return;
        }

        completeTeacherLogin(teacher);
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

  const completeTeacherLogin = (teacher: any) => {
    const teacherClasses = teacher.assignedClasses || teacher.classes || [];
    const teacherSubjects = teacher.assignedSubjects || teacher.subjects || [];
    const teacherSections = teacher.assignedSections || teacher.sections || [];

    // Store teacher info in localStorage for session management
    localStorage.setItem(
      "loggedInTeacher",
      JSON.stringify({
        id: teacher.id,
        name: teacher.name,
        school_id: teacher.school_id,
        license_id: teacher.license_id,
        // Store both naming conventions for compatibility
        classes: teacherClasses,
        subjects: teacherSubjects,
        sections: teacherSections,
        assignedClasses: teacherClasses,
        assignedSubjects: teacherSubjects,
        assignedSections: teacherSections,
        role: teacher.role || "teacher",
      })
    );

    // Also set currentTeacherId and schoolId for compatibility
    localStorage.setItem("currentTeacherId", teacher.id);
    localStorage.setItem("currentSchoolId", teacher.school_id);

    // Save last logged in user
    saveLastUser({
      name: teacher.name,
      type: 'teacher',
      timestamp: new Date().toISOString()
    });

    toast({
      title: "تم تسجيل الدخول بنجاح",
      description: `مرحباً بك ${teacher.name}`,
    });

    // Redirect to dashboard
    navigate("/dashboard");
  };

  const handlePasswordChangeSuccess = async () => {
    setShowPasswordChange(false);
    // Complete login with the pending teacher data stored earlier
    if (pendingTeacherId) {
      // Get teacher data from localStorage if available
      const loggedInTeacher = localStorage.getItem("loggedInTeacher");
      if (loggedInTeacher) {
        const teacher = JSON.parse(loggedInTeacher);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${teacher.name}`,
        });
        navigate("/dashboard");
      }
    }
    setPendingTeacherId(null);
    setPendingTeacherName("");
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

  // Normal login/register view
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
            <CardTitle className="text-center text-2xl">صفحة المعلمين</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 mt-2">
            {!isActivated && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  أنت في الفترة التجريبية. متبقي {trialDaysLeft} يوم.
                </p>
              </div>
            )}
            
            {/* تسجيل الدخول فقط - التسجيل يتم من خلال المدير */}
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                تسجيل الدخول
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                للحصول على حساب، تواصل مع مدير المدرسة
              </p>
            </div>

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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forced Password Change Dialog */}
      {pendingTeacherId && (
        <TeacherChangePasswordDialog
          open={showPasswordChange}
          teacherId={pendingTeacherId}
          isForced={true}
          onSuccess={handlePasswordChangeSuccess}
        />
      )}
    </div>
  );
};

export default TeacherLogin;
