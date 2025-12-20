import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import LicenseActivation from "@/components/LicenseActivation";
import LicenseExpiryWarning from "@/components/LicenseExpiryWarning";
import { useLicenseContext } from "@/contexts/LicenseContext";
import ThemeToggle from "@/components/ThemeToggle";
import SystemLogo from "@/components/SystemLogo";
import ParticlesBackground from "@/components/ParticlesBackground";
import ColorCustomizer from "@/components/ColorCustomizer";
import PageTransition from "@/components/PageTransition";
import { useColorStore } from "@/stores/colorStore";

const Index = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    isActivated,
    isTrial,
    remainingDays,
    schoolName,
    directorName,
    showExpiryWarning,
    activateLicense,
    startTrialLicense,
  } = useLicenseContext();

  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Apply saved color theme - MUST be called before any conditional returns
  const { applyTheme } = useColorStore();
  
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

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
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-secondary dark:bg-black relative overflow-hidden">
        <ParticlesBackground particleCount={40} />
        <div className="text-center space-y-6 max-w-2xl relative z-10">
          <SystemLogo size={120} className="mx-auto" />
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground dark:text-white mb-6">
            نظام تحليل نتائج الاختبارات المدرسية
          </h1>
          
          <div className="w-full max-w-md mx-auto bg-gray-900/50 h-4 rounded-full overflow-hidden backdrop-blur">
            <div 
              className="h-full bg-gradient-to-r from-primary via-white to-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-accent text-xl">جاري تحميل النظام... {progress}%</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking license
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent dark:from-black dark:via-gray-900 dark:to-green-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-primary border-primary/30 mx-auto"></div>
          <p className="mt-4 text-lg text-foreground dark:text-white">جاري التحقق من الترخيص...</p>
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
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-gradient-to-br from-secondary via-background to-destructive dark:from-black dark:via-gray-900 dark:to-red-900">
        <Card className="w-full max-w-lg border-2 border-destructive bg-card/95 dark:bg-gray-800/95">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-destructive">
              {isTrial ? "انتهت الفترة التجريبية" : "انتهى الترخيص"}
            </h2>
            <p className="text-muted-foreground">
              يرجى التواصل مع مسؤول النظام لتجديد الترخيص
            </p>
            <Button
              onClick={() => navigate("/system-admin")}
              className="bg-primary hover:bg-primary/90"
            >
              الذهاب لصفحة التجديد
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main page with license info

  // Main page with license info
  return (
    <PageTransition className="min-h-screen">
      <div className="min-h-screen flex flex-col dir-rtl bg-gradient-to-b from-secondary via-background to-accent dark:from-black dark:via-gray-900 dark:to-green-900 relative">
        {/* أزرار التحكم */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <ThemeToggle />
          <ColorCustomizer />
        </div>

      {/* License expiry warning banner */}
      {showExpiryWarning && (
        <LicenseExpiryWarning
          remainingDays={remainingDays}
          isTrial={isTrial}
        />
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <ParticlesBackground particleCount={30} />
        
        <div className="space-y-8 text-center max-w-3xl relative z-10">
          <div className="mb-8">
            <SystemLogo size={100} className="mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary dark:text-red-400 mb-4">
              نظام تحليل نتائج الاختبارات المدرسية
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/80 dark:text-gray-300 font-medium">
              منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
            </p>
          </div>

          {/* School and license info */}
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/20 dark:via-gray-900 dark:to-accent/20 backdrop-blur max-w-lg mx-auto shadow-xl">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4 text-center">
                {/* School Logo */}
                {localStorage.getItem("schoolLogo") && (
                  <div className="mb-4">
                    <img 
                      src={localStorage.getItem("schoolLogo") || ""} 
                      alt="شعار المدرسة" 
                      className="h-20 w-20 object-contain mx-auto rounded-lg border-2 border-primary/30"
                    />
                  </div>
                )}

                {/* School Name */}
                <div className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {schoolName || "مرحباً بكم في النظام"}
                  </span>
                </div>

                {/* Director Name */}
                {directorName && (
                  <div className="text-base border-t border-primary/20 pt-3">
                    <span className="text-muted-foreground">مدير المدرسة: </span>
                    <span className="font-semibold text-foreground">
                      {directorName}
                    </span>
                  </div>
                )}

                {/* License Status */}
                <div className="text-sm border-t border-primary/20 pt-3 flex flex-wrap items-center justify-center gap-3">
                  <span className={`px-4 py-1.5 rounded-full font-medium ${
                    isTrial 
                      ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-300' 
                      : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-300'
                  }`}>
                    {isTrial ? "فترة تجريبية" : "ترخيص مفعل ✓"}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <span className="text-lg">📅</span>
                    متبقي <span className="font-bold text-primary text-lg mx-1">{remainingDays}</span> يوم
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 dark:bg-gray-800 dark:hover:bg-gray-700"
              onClick={() => navigate("/teacher-login")}
            >
              دخول المعلمين
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground dark:border-red-400 dark:text-red-400"
              onClick={() => navigate("/admin-dashboard")}
            >
              لوحة تحكم المدير
            </Button>
            
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-muted-foreground text-muted-foreground hover:bg-muted-foreground hover:text-background dark:border-gray-400 dark:text-gray-400"
              onClick={() => navigate("/system-admin")}
            >
              مسؤول النظام
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-6 text-center text-sm text-foreground/60 dark:text-gray-400">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
          <p>0566000140</p>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Index;
