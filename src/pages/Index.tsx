
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trialDaysLeft, setTrialDaysLeft] = useState(10);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Show welcome screen with progress bar
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowWelcome(false);
            checkActivationStatus();
          }, 500);
          return 100;
        }
        return prevProgress + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const checkActivationStatus = async () => {
    try {
      // Check if system is activated
      let activationStatus;
      let daysLeft;
      
      if (isElectron()) {
        // Get settings from the electron backend
        const settings = await electronService.getSystemSettings();
        activationStatus = settings.systemActivated === "true";
        
        if (!activationStatus) {
          // Calculate trial days left
          const installDate = settings.installDate || new Date().toISOString();
          const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
          daysLeft = Math.max(0, 10 - daysElapsed);
        }
      } else {
        // Web environment
        activationStatus = localStorage.getItem("systemActivated") === "true";
        
        if (!activationStatus) {
          // Calculate trial days left
          const installDate = localStorage.getItem("installDate");
          if (!installDate) {
            // First time visiting the site
            const today = new Date().toISOString();
            localStorage.setItem("installDate", today);
            localStorage.setItem("trialDaysLeft", "10");
            daysLeft = 10;
          } else {
            // Calculate days since installation
            const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
            daysLeft = Math.max(0, 10 - daysElapsed);
            localStorage.setItem("trialDaysLeft", daysLeft.toString());
          }
        }
      }
      
      setIsActivated(activationStatus);
      
      if (!activationStatus && daysLeft !== undefined) {
        setTrialDaysLeft(daysLeft);
      }
    } catch (error) {
      console.error("Error checking activation status:", error);
    } finally {
      setIsLoading(false);
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
        // Use the Electron service to activate the license
        result = await electronService.activateLicense(activationKey);
      } else {
        // Web environment - get stored licenses from localStorage
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
      console.error("Error activating license:", error);
      toast({
        title: "خطأ في تنشيط الترخيص",
        description: "حدث خطأ أثناء محاولة تنشيط الترخيص",
        variant: "destructive",
      });
    }
  };

  // Show welcome screen with loading bar
  if (showWelcome) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-black"
      >
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            نظام تحليل نتائج الاختبارات المدرسية
          </h1>
          
          <div className="w-full max-w-md mx-auto bg-gray-900 h-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-white to-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-green-400 text-xl">جاري تحميل النظام... {progress}%</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-green-600 border-green-600/30 mx-auto"></div>
          <p className="mt-4 text-lg">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4"
      style={{
        background: "linear-gradient(to bottom, #000000 0%, #ffffff 50%, #34A853 100%)"
      }}
    >
      <div className="space-y-8 text-center max-w-3xl relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#E84c3d] mb-4">
            نظام تحليل نتائج الاختبارات المدرسية
          </h1>
          
          <p className="text-xl md:text-2xl text-black font-medium">
            منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
          </p>
        </div>

        {!isActivated && trialDaysLeft > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-[#E84c3d] max-w-md mx-auto">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-black">الفترة التجريبية</h2>
                <p className="text-sm">
                  متبقي <span className="text-[#E84c3d] font-bold">{trialDaysLeft}</span> يوم من الفترة التجريبية
                </p>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="أدخل مفتاح التنشيط"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                  <Button 
                    className="bg-[#E84c3d] hover:bg-red-700 text-white"
                    onClick={handleActivation}
                  >
                    تنشيط
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isActivated && trialDaysLeft <= 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-red-600 max-w-md mx-auto">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-red-600">انتهت الفترة التجريبية</h2>
                <p className="text-sm">
                  لقد انتهت الفترة التجريبية. الرجاء تنشيط النظام للاستمرار.
                </p>
                
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="أدخل مفتاح التنشيط"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                  <Button 
                    className="bg-[#E84c3d] hover:bg-red-700 text-white"
                    onClick={handleActivation}
                  >
                    تنشيط
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-black text-white hover:bg-gray-800"
            onClick={() => navigate("/teacher-login")}
            disabled={!isActivated && trialDaysLeft <= 0}
          >
            دخول المعلمين
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-[#E84c3d] text-[#E84c3d] hover:bg-[#E84c3d] hover:text-white"
            onClick={() => navigate("/admin")}
            disabled={!isActivated && trialDaysLeft <= 0}
          >
            لوحة تحكم المدير
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
            onClick={() => navigate("/system-admin")}
          >
            مسؤول النظام
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-sm text-black">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
        <p>0566000140</p>
      </div>
    </div>
  );
};

export default Index;
