import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settingsStore";
import { Save } from "lucide-react";

const CopyrightSettingsForm = () => {
  const { toast } = useToast();
  const { copyrightText, copyrightPhone, setCopyrightText, setCopyrightPhone } = useSettingsStore();
  const [localText, setLocalText] = useState(copyrightText);
  const [localPhone, setLocalPhone] = useState(copyrightPhone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    try {
      setCopyrightText(localText);
      setCopyrightPhone(localPhone);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات حقوق النشر بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحفظ",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          هذه الإعدادات تظهر في تذييل الصفحة الرئيسية للنظام
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>اسم صاحب الحقوق / الشركة</Label>
        <Input 
          placeholder="مثال: محمد الشوامرة للبرمجة والتصميم"
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>رقم الهاتف / التواصل</Label>
        <Input 
          placeholder="مثال: 0566000140"
          value={localPhone}
          onChange={(e) => setLocalPhone(e.target.value)}
          dir="ltr"
          className="text-left"
        />
      </div>
      
      <div className="p-3 bg-gray-50 rounded-lg border">
        <p className="text-sm text-gray-600 mb-1">معاينة:</p>
        <p className="text-sm">جميع الحقوق محفوظة © {new Date().getFullYear()} - {localText}</p>
        <p className="text-sm">{localPhone}</p>
      </div>
      
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save className="h-4 w-4 ml-2" />
        {isSaving ? "جاري الحفظ..." : "حفظ إعدادات حقوق النشر"}
      </Button>
    </div>
  );
};

export default CopyrightSettingsForm;
