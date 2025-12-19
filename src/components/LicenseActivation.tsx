import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Building2, Clock } from "lucide-react";

interface LicenseActivationProps {
  onActivate: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  onStartTrial: (schoolName: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

const LicenseActivation = ({ onActivate, onStartTrial, isLoading }: LicenseActivationProps) => {
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
    <div className="min-h-screen flex flex-col items-center justify-center dir-rtl px-4 bg-gradient-to-br from-black via-gray-900 to-green-900">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          نظام تحليل نتائج الاختبارات المدرسية
        </h1>
        <p className="text-gray-300 text-lg">
          قم بتفعيل الترخيص أو بدء فترة تجريبية للمتابعة
        </p>
      </div>

      <Card className="w-full max-w-lg border-2 border-[#E84C3D] bg-white/95 backdrop-blur">
        <CardHeader className="bg-gradient-to-r from-[#E84C3D] to-red-700 text-white">
          <CardTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Key className="h-5 w-5" />
            تفعيل الترخيص
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="activate" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                لدي مفتاح ترخيص
              </TabsTrigger>
              <TabsTrigger value="trial" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                فترة تجريبية
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseKey">مفتاح الترخيص</Label>
                <Input
                  id="licenseKey"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                  dir="ltr"
                />
              </div>
              <Button
                onClick={handleActivate}
                className="w-full bg-[#E84C3D] hover:bg-red-700"
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
              <p className="text-xs text-gray-500 text-center">
                للحصول على مفتاح ترخيص، تواصل مع مسؤول النظام
              </p>
            </TabsContent>

            <TabsContent value="trial" className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <Clock className="h-5 w-5" />
                  فترة تجريبية مجانية - 15 يوم
                </div>
                <p className="text-green-700 text-sm">
                  جرب النظام مجاناً لمدة 15 يوم. جميع الميزات متاحة خلال الفترة التجريبية.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schoolName">اسم المدرسة</Label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="schoolName"
                    placeholder="أدخل اسم المدرسة"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Button
                onClick={handleStartTrial}
                className="w-full bg-green-600 hover:bg-green-700"
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

      <div className="mt-8 text-center text-sm text-gray-400">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
        <p>0566000140</p>
      </div>
    </div>
  );
};

export default LicenseActivation;
