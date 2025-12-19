import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import LicenseActivation from "@/components/LicenseActivation";
import LicenseExpiryWarning from "@/components/LicenseExpiryWarning";
import { useLicenseContext } from "@/contexts/LicenseContext";

const Index = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    isActivated,
    isTrial,
    remainingDays,
    schoolName,
    showExpiryWarning,
    activateLicense,
    startTrialLicense,
  } = useLicenseContext();

  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowWelcome(false);
          }, 500);
          return 100;
        }
        return prevProgress + 5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Show welcome screen with loading bar
  if (showWelcome) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-black">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            نظام تحليل نتائج الاختبارات المدرسية
          </h1>
          
          <div className="w-full max-w-md mx-auto bg-gray-900 h-4 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#E84C3D] via-white to-[#34A853] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-[#34A853] text-xl">جاري تحميل النظام... {progress}%</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking license
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-green-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#E84C3D] border-[#E84C3D]/30 mx-auto"></div>
          <p className="mt-4 text-lg text-white">جاري التحقق من الترخيص...</p>
        </div>
      </div>
    );
  }

  // Show activation screen if not activated
  if (!isActivated) {
    return (
      <LicenseActivation
        onActivate={activateLicense}
        onStartTrial={startTrialLicense}
      />
    );
  }

  // Check if license/trial expired
  if (remainingDays <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-gradient-to-br from-black via-gray-900 to-red-900">
        <Card className="w-full max-w-lg border-2 border-red-600 bg-white/95">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600">
              {isTrial ? "انتهت الفترة التجريبية" : "انتهى الترخيص"}
            </h2>
            <p className="text-gray-600">
              يرجى التواصل مع مسؤول النظام لتجديد الترخيص
            </p>
            <Button
              onClick={() => navigate("/system-admin")}
              className="bg-[#E84C3D] hover:bg-red-700"
            >
              الذهاب لصفحة التجديد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main page with license info
  return (
    <div className="min-h-screen flex flex-col dir-rtl">
      {/* License expiry warning banner */}
      {showExpiryWarning && (
        <LicenseExpiryWarning
          remainingDays={remainingDays}
          isTrial={isTrial}
        />
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 palestine-gradient">
        <div className="space-y-8 text-center max-w-3xl relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#E84c3d] mb-4">
              نظام تحليل نتائج الاختبارات المدرسية
            </h1>
            
            <p className="text-xl md:text-2xl text-black font-medium">
              منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
            </p>
          </div>

          {/* School and license info */}
          <Card className="palestine-card max-w-md mx-auto">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3 text-right">
                {schoolName && (
                  <div className="text-lg">
                    <span className="text-gray-600">المدرسة: </span>
                    <span className="font-bold text-[#E84c3d]">{schoolName}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className={`px-3 py-1 rounded-full ${
                    isTrial ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {isTrial ? `فترة تجريبية` : "ترخيص مفعل"}
                  </span>
                  <span className="mr-2 text-gray-600">
                    متبقي <span className="font-bold text-[#E84c3d]">{remainingDays}</span> يوم
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="palestine-button-secondary"
              onClick={() => navigate("/teacher-login")}
            >
              دخول المعلمين
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-[#E84c3d] text-[#E84c3d] hover:bg-[#E84c3d] hover:text-white"
              onClick={() => navigate("/admin")}
            >
              لوحة تحكم المدير
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-[#34A853] text-[#34A853] hover:bg-[#34A853] hover:text-white"
              onClick={() => navigate("/statistics")}
            >
              الإحصائيات
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white"
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
    </div>
  );
};

export default Index;
