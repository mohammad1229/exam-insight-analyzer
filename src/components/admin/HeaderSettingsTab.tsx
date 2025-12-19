import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Default header settings
const DEFAULT_HEADER_SETTINGS = {
  // Right side (Ministry)
  rightLine1: "دولة فلسطين",
  rightLine1En: "State of Palestine",
  rightLine2: "وزارة التربية والتعليم العالي",
  rightLine3: "مديرية التربية والتعليم",
  
  // Left side (School)
  leftLine1: "Ministry of Education",
  leftLine2: "Directorate of Education",
  leftLine3: "",
};

export const getHeaderSettings = () => {
  const saved = localStorage.getItem("headerSettings");
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_HEADER_SETTINGS;
};

const HeaderSettingsTab = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Header settings state
  const [rightLine1, setRightLine1] = useState(DEFAULT_HEADER_SETTINGS.rightLine1);
  const [rightLine1En, setRightLine1En] = useState(DEFAULT_HEADER_SETTINGS.rightLine1En);
  const [rightLine2, setRightLine2] = useState(DEFAULT_HEADER_SETTINGS.rightLine2);
  const [rightLine3, setRightLine3] = useState(DEFAULT_HEADER_SETTINGS.rightLine3);
  const [leftLine1, setLeftLine1] = useState(DEFAULT_HEADER_SETTINGS.leftLine1);
  const [leftLine2, setLeftLine2] = useState(DEFAULT_HEADER_SETTINGS.leftLine2);
  const [leftLine3, setLeftLine3] = useState(DEFAULT_HEADER_SETTINGS.leftLine3);

  // Load saved settings on mount
  useEffect(() => {
    const settings = getHeaderSettings();
    setRightLine1(settings.rightLine1 || DEFAULT_HEADER_SETTINGS.rightLine1);
    setRightLine1En(settings.rightLine1En || DEFAULT_HEADER_SETTINGS.rightLine1En);
    setRightLine2(settings.rightLine2 || DEFAULT_HEADER_SETTINGS.rightLine2);
    setRightLine3(settings.rightLine3 || DEFAULT_HEADER_SETTINGS.rightLine3);
    setLeftLine1(settings.leftLine1 || DEFAULT_HEADER_SETTINGS.leftLine1);
    setLeftLine2(settings.leftLine2 || DEFAULT_HEADER_SETTINGS.leftLine2);
    setLeftLine3(settings.leftLine3 || DEFAULT_HEADER_SETTINGS.leftLine3);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    const settings = {
      rightLine1,
      rightLine1En,
      rightLine2,
      rightLine3,
      leftLine1,
      leftLine2,
      leftLine3,
    };

    localStorage.setItem("headerSettings", JSON.stringify(settings));
    
    toast({
      title: "✓ تم حفظ إعدادات الترويسة",
      description: "ستظهر التعديلات في جميع التقارير الجديدة",
    });
    
    setIsSaving(false);
  };

  const schoolLogo = localStorage.getItem("schoolLogo");
  const schoolName = localStorage.getItem("schoolName") || "اسم المدرسة";

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          إعدادات ترويسة التقرير
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-6">
          قم بتعديل محتوى الترويسة التي تظهر في جميع التقارير. الشعار يظهر في المنتصف ويمكنك تغييره من تبويب الإعدادات.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Right Side (Arabic - Ministry) */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="font-bold text-lg text-blue-800 border-b pb-2">الجانب الأيمن (الوزارة)</h3>
            
            <div>
              <Label>السطر الأول (عربي)</Label>
              <Input 
                value={rightLine1}
                onChange={(e) => setRightLine1(e.target.value)}
                className="mt-1"
                placeholder="دولة فلسطين"
              />
            </div>
            
            <div>
              <Label>السطر الأول (إنجليزي)</Label>
              <Input 
                value={rightLine1En}
                onChange={(e) => setRightLine1En(e.target.value)}
                className="mt-1"
                placeholder="State of Palestine"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>السطر الثاني</Label>
              <Input 
                value={rightLine2}
                onChange={(e) => setRightLine2(e.target.value)}
                className="mt-1"
                placeholder="وزارة التربية والتعليم العالي"
              />
            </div>
            
            <div>
              <Label>السطر الثالث</Label>
              <Input 
                value={rightLine3}
                onChange={(e) => setRightLine3(e.target.value)}
                className="mt-1"
                placeholder="مديرية التربية والتعليم"
              />
            </div>
          </div>

          {/* Left Side (English - School) */}
          <div className="space-y-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <h3 className="font-bold text-lg text-green-800 border-b pb-2">الجانب الأيسر (بالإنجليزية)</h3>
            
            <div>
              <Label>السطر الأول</Label>
              <Input 
                value={leftLine1}
                onChange={(e) => setLeftLine1(e.target.value)}
                className="mt-1"
                placeholder="Ministry of Education"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>السطر الثاني</Label>
              <Input 
                value={leftLine2}
                onChange={(e) => setLeftLine2(e.target.value)}
                className="mt-1"
                placeholder="Directorate of Education"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label>السطر الثالث (اختياري)</Label>
              <Input 
                value={leftLine3}
                onChange={(e) => setLeftLine3(e.target.value)}
                className="mt-1"
                placeholder="نص إضافي..."
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
            className="mb-4"
          >
            <Eye className="h-4 w-4 ml-2" />
            {showPreview ? "إخفاء المعاينة" : "معاينة الترويسة"}
          </Button>

          {showPreview && (
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              {/* Classic Frame Header */}
              <div className="border-4 border-double border-gray-700 p-3 mb-2">
                <div className="flex justify-between items-start">
                  {/* Right - Ministry */}
                  <div className="text-center text-sm">
                    <p className="font-bold">{rightLine1}</p>
                    <p className="text-xs">{rightLine1En}</p>
                    <p>{rightLine2}</p>
                    <p>{rightLine3}</p>
                  </div>

                  {/* Center - Logo */}
                  <div className="text-center">
                    {schoolLogo ? (
                      <img src={schoolLogo} alt="Logo" className="h-16 w-16 mx-auto object-contain" />
                    ) : (
                      <div className="h-16 w-16 mx-auto border-2 border-gray-400 rounded flex items-center justify-center text-gray-400">
                        شعار
                      </div>
                    )}
                    <p className="font-bold text-sm mt-1">{schoolName}</p>
                  </div>

                  {/* Left - English */}
                  <div className="text-center text-sm">
                    <p>{leftLine1}</p>
                    <p>{leftLine2}</p>
                    {leftLine3 && <p>{leftLine3}</p>}
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                هذا نموذج تقريبي للترويسة - الترويسة الفعلية في التقرير ستظهر بتنسيق PDF
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t mt-6">
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-8"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 ml-2" />
            {isSaving ? "جاري الحفظ..." : "حفظ إعدادات الترويسة"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeaderSettingsTab;
