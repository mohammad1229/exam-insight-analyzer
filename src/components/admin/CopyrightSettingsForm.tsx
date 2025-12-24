import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settingsStore";
import { Save, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const PROTECTION_PASSWORD = "admin2024";

const CopyrightSettingsForm = () => {
  const { toast } = useToast();
  const { copyrightText, copyrightPhone, setCopyrightText, setCopyrightPhone } = useSettingsStore();
  const [localText, setLocalText] = useState(copyrightText);
  const [localPhone, setLocalPhone] = useState(copyrightPhone);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password confirmation state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSaveClick = () => {
    setConfirmPassword("");
    setPasswordError("");
    setShowPasswordDialog(true);
  };

  const handleConfirmSave = () => {
    if (confirmPassword !== PROTECTION_PASSWORD) {
      setPasswordError("كلمة المرور غير صحيحة");
      return;
    }

    setIsSaving(true);
    try {
      setCopyrightText(localText);
      setCopyrightPhone(localPhone);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات حقوق النشر بنجاح",
      });
      setShowPasswordDialog(false);
      setConfirmPassword("");
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
    <>
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

        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-amber-800">
            <Lock className="h-4 w-4" />
            <p className="text-sm font-medium">محمي بكلمة مرور</p>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            سيُطلب منك إدخال كلمة المرور للتأكيد قبل حفظ التغييرات
          </p>
        </div>
        
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleSaveClick}
          disabled={isSaving}
        >
          <Lock className="h-4 w-4 ml-2" />
          {isSaving ? "جاري الحفظ..." : "حفظ إعدادات حقوق النشر"}
        </Button>
      </div>

      {/* Password Confirmation Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              تأكيد كلمة المرور
            </DialogTitle>
            <DialogDescription>
              أدخل كلمة المرور للتأكيد قبل حفظ التغييرات على إعدادات حقوق النشر
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConfirmSave();
                  }
                }}
              />
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowPasswordDialog(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="button" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirmSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 ml-2" />
              تأكيد الحفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CopyrightSettingsForm;
