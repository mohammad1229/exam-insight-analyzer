
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Image, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isElectron } from "@/services/electronService";
import electronService from "@/services/electronService";

const SettingsTab = () => {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("مدرسة النجاح الثانوية");
  const [academicYear, setAcademicYear] = useState("2023-2024");
  const [directorName, setDirectorName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState<string>("");
  const [ministryName, setMinistryName] = useState("وزارة التربية والتعليم العالي");
  const [directorateName, setDirectorateName] = useState("مديرية التربية والتعليم");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load school settings
      const settingsStr = localStorage.getItem("schoolSettings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        setSchoolName(settings.name || "مدرسة النجاح الثانوية");
        setAcademicYear(settings.academicYear || "2023-2024");
        setDirectorName(settings.directorName || "");
        setSchoolLogo(settings.logo || "");
        setMinistryName(settings.ministryName || "وزارة التربية والتعليم العالي");
        setDirectorateName(settings.directorateName || "مديرية التربية والتعليم");
      }
      
      // Also load from legacy keys
      const legacySchoolName = localStorage.getItem("schoolName");
      const legacyDirectorName = localStorage.getItem("directorName");
      const legacyMinistryName = localStorage.getItem("ministryName");
      const legacyDirectorateName = localStorage.getItem("directorateName");
      if (legacySchoolName) setSchoolName(legacySchoolName);
      if (legacyDirectorName) setDirectorName(legacyDirectorName);
      if (legacyMinistryName) setMinistryName(legacyMinistryName);
      if (legacyDirectorateName) setDirectorateName(legacyDirectorateName);
      
      // Load logo
      const savedLogo = localStorage.getItem("schoolLogo");
      if (savedLogo) setSchoolLogo(savedLogo);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء محاولة تحميل البيانات",
        variant: "destructive",
      });
    }
  };
  
  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 500000) { // 500KB limit
      toast({
        title: "الملف كبير جداً",
        description: "يجب أن يكون حجم الشعار أقل من 500 كيلوبايت",
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSchoolLogo(base64);
      localStorage.setItem("schoolLogo", base64);
      toast({
        title: "تم رفع الشعار",
        description: "تم رفع شعار المدرسة بنجاح - سيظهر في جميع التقارير",
      });
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveLogo = () => {
    setSchoolLogo("");
    localStorage.removeItem("schoolLogo");
    toast({
      title: "تم حذف الشعار",
      description: "تم حذف شعار المدرسة",
    });
  };

  // Function to handle settings save
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const settings = {
        name: schoolName,
        academicYear: academicYear,
        directorName: directorName,
        logo: schoolLogo,
        ministryName: ministryName,
        directorateName: directorateName
      };
      
      // Save to both keys for compatibility
      localStorage.setItem("schoolName", schoolName);
      localStorage.setItem("directorName", directorName);
      localStorage.setItem("ministryName", ministryName);
      localStorage.setItem("directorateName", directorateName);
      
      if (isElectron()) {
        await electronService.updateSystemSettings({
          schoolName: schoolName,
          academicYear: academicYear,
          directorName: directorName,
          ministryName: ministryName,
          directorateName: directorateName
        });
      } else {
        localStorage.setItem("schoolSettings", JSON.stringify(settings));
      }
      
      toast({
        title: "✓ تم حفظ الإعدادات بنجاح",
        description: "تم تحديث جميع إعدادات النظام والتقارير",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء محاولة حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-white border-b border-black">
        <CardTitle>إعدادات النظام</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Basic School Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>اسم المدرسة</Label>
              <Input 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>اسم المدير</Label>
              <Input 
                value={directorName} 
                onChange={(e) => setDirectorName(e.target.value)}
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>اسم الوزارة</Label>
              <Input 
                value={ministryName} 
                onChange={(e) => setMinistryName(e.target.value)}
                className="mt-1" 
                placeholder="وزارة التربية والتعليم العالي"
              />
            </div>
            
            <div>
              <Label>اسم المديرية</Label>
              <Input 
                value={directorateName} 
                onChange={(e) => setDirectorateName(e.target.value)}
                className="mt-1" 
                placeholder="مديرية التربية والتعليم / جنوب الخليل"
              />
            </div>
            
            <div>
              <Label>العام الدراسي</Label>
              <Input 
                value={academicYear} 
                onChange={(e) => setAcademicYear(e.target.value)}
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label>شعار المدرسة</Label>
              <div className="mt-1 flex items-center gap-4">
                {schoolLogo ? (
                  <div className="relative">
                    <img src={schoolLogo} alt="School Logo" className="h-16 w-16 object-contain border rounded" />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-16 w-16 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Image className="h-4 w-4 ml-2" />
                  رفع شعار
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 500 كيلوبايت - يظهر في وسط ترويسة جميع التقارير</p>
            </div>
          </div>
          
          {/* Save Button */}
          <div className="border-t border-gray-200 pt-6">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>جاري الحفظ...</>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsTab;
