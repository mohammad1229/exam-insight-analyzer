import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Building2, Clock, Settings } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SystemLogo from "@/components/SystemLogo";
import ParticlesBackground from "@/components/ParticlesBackground";
import ColorCustomizer from "@/components/ColorCustomizer";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";

interface LicenseActivationProps {
  onActivate: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  onStartTrial: (schoolName: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

const LicenseActivation = ({ onActivate, onStartTrial, isLoading }: LicenseActivationProps) => {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [activeTab, setActiveTab] = useState("activate");
  const [localLoading, setLocalLoading] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) return;
    setLocalLoading(true);
    await onActivate(licenseKey.trim());
    setLocalLoading(false);
  };

  const handleStartTrial = async () => {
    if (!schoolName.trim()) return;
    setLocalLoading(true);
    await onStartTrial(schoolName.trim());
    setLocalLoading(false);
  };

  const loading = isLoading || localLoading;

  return (
    <PageTransition className="min-h-screen">
      <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 relative overflow-hidden">
        {/* خلفية متحركة جديدة */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* تأثير الشبكة */}
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
          
          {/* كرات متوهجة */}
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
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* الجسيمات */}
        <ParticlesBackground particleCount={50} colors={["#E84C3D", "#34A853", "#9333ea", "#ffffff"]} />

        {/* أزرار التحكم */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
          <ThemeToggle />
          <ColorCustomizer />
          <Button
            variant="outline"
            onClick={() => navigate("/system-admin")}
            className="bg-white/10 backdrop-blur border-white/20 text-white font-semibold hover:bg-white/20 flex items-center gap-2 transition-transform duration-200 hover:scale-105"
          >
            <Settings className="h-4 w-4" />
            مسؤول النظام
          </Button>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* الشعار */}
          <motion.div 
            className="mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 1 }}
          >
            <SystemLogo size={130} />
          </motion.div>

          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              نظام تحليل نتائج الاختبارات المدرسية
            </h1>
            <p className="text-gray-300 text-lg">
              قم بتفعيل الترخيص أو بدء فترة تجريبية للمتابعة
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="w-full max-w-lg border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
                <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
                  <Key className="h-5 w-5" />
                  تفعيل الترخيص
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 w-full mb-6 bg-white/10">
                    <TabsTrigger value="activate" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                      <Key className="h-4 w-4" />
                      لدي مفتاح ترخيص
                    </TabsTrigger>
                    <TabsTrigger value="trial" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-accent">
                      <Clock className="h-4 w-4" />
                      فترة تجريبية
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="activate" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="licenseKey" className="text-white">مفتاح الترخيص</Label>
                      <Input
                        id="licenseKey"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={licenseKey}
                        onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                        className="text-center font-mono text-lg tracking-wider bg-white/90 border-0"
                        dir="ltr"
                      />
                    </div>
                    <Button
                      onClick={handleActivate}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      disabled={loading || !licenseKey.trim()}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          جاري التنشيط...
                        </span>
                      ) : (
                        "تنشيط الترخيص"
                      )}
                    </Button>
                    <p className="text-xs text-gray-300 text-center">
                      للحصول على مفتاح ترخيص، تواصل مع مسؤول النظام
                    </p>
                  </TabsContent>

                  <TabsContent value="trial" className="space-y-4">
                    <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-accent font-semibold mb-2">
                        <Clock className="h-5 w-5" />
                        فترة تجريبية مجانية - 15 يوم
                      </div>
                      <p className="text-gray-300 text-sm">
                        جرب النظام مجاناً لمدة 15 يوم. جميع الميزات متاحة خلال الفترة التجريبية.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="schoolName" className="text-white">اسم المدرسة</Label>
                      <div className="relative">
                        <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="schoolName"
                          placeholder="أدخل اسم المدرسة"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          className="pr-10 bg-white/90 border-0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleStartTrial}
                      className="w-full bg-accent hover:bg-accent/90 text-white font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                      disabled={loading || !schoolName.trim()}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          جاري التسجيل...
                        </span>
                      ) : (
                        "بدء الفترة التجريبية"
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            className="mt-8 text-center text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
            <p>0566000140</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default LicenseActivation;
