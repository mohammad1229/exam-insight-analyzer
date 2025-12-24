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
import CopyrightFooter from "@/components/CopyrightFooter";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Users, UserCog, Settings, LogIn, User, ArrowRight, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper to get last logged in user
const getLastUser = () => {
  const saved = localStorage.getItem("lastLoggedInUser");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Helper to save last logged in user
export const saveLastUser = (user: { name: string; type: 'teacher' | 'admin'; timestamp: string }) => {
  localStorage.setItem("lastLoggedInUser", JSON.stringify(user));
};

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
  const [showUserTypeDialog, setShowUserTypeDialog] = useState(false);
  const [lastUser, setLastUser] = useState<{ name: string; type: 'teacher' | 'admin'; timestamp: string } | null>(null);
  
  // Apply saved color theme - MUST be called before any conditional returns
  const { applyTheme } = useColorStore();
  
  useEffect(() => {
    applyTheme();
    // Load last user
    const user = getLastUser();
    setLastUser(user);
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

  const handleLoginClick = () => {
    setShowUserTypeDialog(true);
  };

  const handleUserTypeSelect = (type: 'teacher' | 'admin') => {
    setShowUserTypeDialog(false);
    if (type === 'teacher') {
      navigate("/teacher-login");
    } else {
      navigate("/admin-dashboard");
    }
  };

  const handleQuickLogin = () => {
    if (lastUser) {
      if (lastUser.type === 'teacher') {
        navigate("/teacher-login");
      } else {
        navigate("/admin-dashboard");
      }
    }
  };

  const formatLastLoginTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

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

  // Main page - License is activated, show login options
  return (
    <PageTransition className="min-h-screen">
      <div className="min-h-screen flex flex-col dir-rtl relative overflow-hidden">
        {/* خلفية متحركة */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <ParticlesBackground particleCount={30} colors={["#E84C3D", "#34A853", "#9333ea", "#ffffff"]} />

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

        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
          <div className="space-y-8 text-center max-w-3xl">
            {/* الشعار */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1 }}
            >
              <SystemLogo size={100} className="mx-auto mb-4" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                نظام تحليل نتائج الاختبارات المدرسية
              </h1>
              <p className="text-lg text-gray-300">
                منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
              </p>
            </motion.div>

            {/* بطاقة حالة الترخيص */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl max-w-lg mx-auto">
                <CardContent className="pt-6 pb-6">
                  <div className="space-y-4 text-center">
                    {/* أيقونة الترخيص المفعل */}
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle className="h-6 w-6" />
                      <span className="text-lg font-bold">الترخيص مفعل</span>
                    </div>

                    {/* شعار المدرسة */}
                    {localStorage.getItem("schoolLogo") && (
                      <div className="mb-2">
                        <img 
                          src={localStorage.getItem("schoolLogo") || ""} 
                          alt="شعار المدرسة" 
                          className="h-16 w-16 object-contain mx-auto rounded-lg border-2 border-white/30"
                        />
                      </div>
                    )}

                    {/* اسم المدرسة */}
                    <div className="text-xl font-bold text-white">
                      {schoolName || "مرحباً بكم في النظام"}
                    </div>

                    {/* اسم المدير */}
                    {directorName && (
                      <div className="text-sm text-gray-300 border-t border-white/20 pt-3">
                        <span className="text-gray-400">مدير المدرسة: </span>
                        <span className="font-semibold">{directorName}</span>
                      </div>
                    )}

                    {/* حالة الترخيص */}
                    <div className="flex flex-wrap items-center justify-center gap-3 border-t border-white/20 pt-3">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                        isTrial 
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' 
                          : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}>
                        {isTrial ? "فترة تجريبية" : "ترخيص مفعل ✓"}
                      </span>
                      <span className="text-gray-300 flex items-center gap-1 text-sm">
                        <span>📅</span>
                        متبقي <span className="font-bold text-primary text-lg mx-1">{remainingDays}</span> يوم
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* آخر مستخدم قام بتسجيل الدخول */}
            <AnimatePresence>
              {lastUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card className="border border-blue-400/30 bg-blue-500/10 backdrop-blur-xl max-w-md mx-auto cursor-pointer hover:bg-blue-500/20 transition-all duration-200"
                    onClick={handleQuickLogin}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500/30 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-300" />
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{lastUser.name}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <span>{lastUser.type === 'teacher' ? 'معلم' : 'مدير'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatLastLoginTime(lastUser.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          متابعة
                          <ArrowRight className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* زر تسجيل الدخول */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold shadow-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 px-12 py-6 text-lg"
                onClick={handleLoginClick}
              >
                <LogIn className="h-6 w-6" />
                تسجيل الدخول
              </Button>
              
              <div className="pt-2">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-2"
                  onClick={() => navigate("/system-admin")}
                >
                  <Settings className="h-4 w-4" />
                  مسؤول النظام
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* تذييل الصفحة */}
        <motion.div 
          className="relative z-10 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <CopyrightFooter className="text-white/70" />
        </motion.div>

        {/* حوار اختيار نوع المستخدم */}
        <Dialog open={showUserTypeDialog} onOpenChange={setShowUserTypeDialog}>
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 border border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-center text-xl text-white flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                اختر نوع الحساب
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-6">
              {/* خيار المعلم */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="border border-blue-400/30 bg-blue-500/20 hover:bg-blue-500/30 cursor-pointer transition-all duration-200 h-full"
                  onClick={() => handleUserTypeSelect('teacher')}
                >
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/30 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">معلم</h3>
                    <p className="text-sm text-gray-400">الدخول كمعلم لإدخال وتحليل النتائج</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* خيار المدير */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card 
                  className="border border-purple-400/30 bg-purple-500/20 hover:bg-purple-500/30 cursor-pointer transition-all duration-200 h-full"
                  onClick={() => handleUserTypeSelect('admin')}
                >
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/30 flex items-center justify-center mx-auto mb-4">
                      <UserCog className="h-8 w-8 text-purple-300" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">مدير المدرسة</h3>
                    <p className="text-sm text-gray-400">الدخول للوحة التحكم والإدارة</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Index;
