
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [trialDaysLeft, setTrialDaysLeft] = useState(10);
  const [isActivated, setIsActivated] = useState(false);
  const [activationKey, setActivationKey] = useState("");

  useEffect(() => {
    // Check if system is activated
    const activationStatus = localStorage.getItem("systemActivated");
    if (activationStatus === "true") {
      setIsActivated(true);
    } else {
      // Calculate trial days left
      const installDate = localStorage.getItem("installDate");
      if (!installDate) {
        // First time visiting the site
        const today = new Date().toISOString();
        localStorage.setItem("installDate", today);
        localStorage.setItem("trialDaysLeft", "10");
        setTrialDaysLeft(10);
      } else {
        // Calculate days since installation
        const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 10 - daysElapsed);
        localStorage.setItem("trialDaysLeft", daysLeft.toString());
        setTrialDaysLeft(daysLeft);
      }
    }
  }, []);

  const handleActivation = () => {
    if (!activationKey) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مفتاح التنشيط",
        variant: "destructive",
      });
      return;
    }

    // Get stored licenses
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

      setIsActivated(true);
      toast({
        title: "تم التنشيط بنجاح",
        description: `تم تنشيط النظام لـ ${license.schoolName} بنجاح`,
      });
    } else {
      toast({
        title: "فشل التنشيط",
        description: "مفتاح التنشيط غير صالح أو مستخدم بالفعل",
        variant: "destructive",
      });
    }
  };

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
