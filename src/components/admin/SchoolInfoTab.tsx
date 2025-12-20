import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { School, User, Image, Save, Loader2 } from "lucide-react";

const SchoolInfoTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    loadSchoolData();
  }, []);

  const loadSchoolData = async () => {
    setIsLoading(true);
    try {
      const currentSchoolId = localStorage.getItem("currentSchoolId");
      if (!currentSchoolId) {
        toast({
          title: "خطأ",
          description: "لم يتم تحديد المدرسة",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setSchoolId(currentSchoolId);

      // Fetch school data from backend
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { action: 'getSchool', schoolId: currentSchoolId }
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setSchoolName(data.data.name || "");
        setDirectorName(data.data.director_name || "");
        setLogoUrl(data.data.logo_url || "");
        setLogoPreview(data.data.logo_url || "");
        setPhone(data.data.phone || "");
        setEmail(data.data.email || "");
        setAddress(data.data.address || "");
      }
    } catch (error) {
      console.error("Error loading school data:", error);
      // Try loading from localStorage as fallback
      setSchoolName(localStorage.getItem("schoolName") || "");
      setDirectorName(localStorage.getItem("directorName") || "");
      setLogoPreview(localStorage.getItem("schoolLogo") || "");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن لا يتجاوز 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setLogoPreview("");
  };

  const handleSave = async () => {
    if (!schoolId) {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد المدرسة",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Update school data in backend
      const { data, error } = await supabase.functions.invoke('school-data', {
        body: { 
          action: 'updateSchool',
          schoolId,
          data: {
            name: schoolName,
            director_name: directorName,
            logo_url: logoUrl,
            phone,
            email,
            address
          }
        }
      });

      if (error) throw error;

      // Also update localStorage for immediate UI updates
      localStorage.setItem("schoolName", schoolName);
      localStorage.setItem("directorName", directorName);
      if (logoUrl) {
        localStorage.setItem("schoolLogo", logoUrl);
      } else {
        localStorage.removeItem("schoolLogo");
      }

      toast({
        title: "تم الحفظ",
        description: "تم تحديث بيانات المدرسة بنجاح",
      });
    } catch (error: any) {
      console.error("Error saving school data:", error);
      toast({
        title: "خطأ",
        description: error.message || "فشل في حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-blue-500">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">جاري تحميل بيانات المدرسة...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader className="bg-blue-50 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <School className="h-5 w-5" />
          بيانات المدرسة
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5" />
            شعار المدرسة
          </Label>
          
          {logoPreview ? (
            <div className="relative">
              <img 
                src={logoPreview} 
                alt="شعار المدرسة" 
                className="h-32 w-32 object-contain rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full"
                onClick={handleRemoveLogo}
              >
                ×
              </Button>
            </div>
          ) : (
            <div className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-white">
              <Image className="h-12 w-12 text-gray-300" />
            </div>
          )}
          
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
            id="logo-upload"
          />
          <Label htmlFor="logo-upload" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                {logoPreview ? "تغيير الشعار" : "رفع شعار"}
              </span>
            </Button>
          </Label>
          <p className="text-xs text-muted-foreground">الحد الأقصى: 2 ميجابايت</p>
        </div>

        {/* School Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="schoolName" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              اسم المدرسة
            </Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="أدخل اسم المدرسة"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="directorName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              اسم مدير المدرسة
            </Label>
            <Input
              id="directorName"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              placeholder="أدخل اسم المدير"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              className="text-right"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              className="text-right"
              dir="ltr"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل عنوان المدرسة"
              className="text-right"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolInfoTab;
