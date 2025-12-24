import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/stores/settingsStore";
import { Save, Lock, Key, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CopyrightSettingsForm = () => {
  const { toast } = useToast();
  const { 
    copyrightText, 
    copyrightPhone, 
    setCopyrightText, 
    setCopyrightPhone,
    setProtectionPassword,
    verifyPassword 
  } = useSettingsStore();
  
  const [localText, setLocalText] = useState(copyrightText);
  const [localPhone, setLocalPhone] = useState(copyrightPhone);
  const [isSaving, setIsSaving] = useState(false);
  
  // Password confirmation state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Change password state
  const [activeTab, setActiveTab] = useState("copyright");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState("");

  const handleSaveClick = () => {
    setConfirmPassword("");
    setPasswordError("");
    setShowPasswordDialog(true);
  };

  const handleConfirmSave = () => {
    if (!verifyPassword(confirmPassword)) {
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

  const handleChangePassword = () => {
    setPasswordChangeError("");
    
    // Validate current password
    if (!verifyPassword(currentPassword)) {
      setPasswordChangeError("كلمة المرور الحالية غير صحيحة");
      return;
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      setPasswordChangeError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    
    // Validate confirmation
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    
    try {
      setProtectionPassword(newPassword);
      toast({
        title: "تم التغيير",
        description: "تم تغيير كلمة مرور الحماية بنجاح",
      });
      // Reset fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="copyright" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            إعدادات الحقوق
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            تغيير كلمة المرور
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="copyright" className="space-y-4">
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
        </TabsContent>
        
        <TabsContent value="password" className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <Key className="h-4 w-4" />
              <p className="text-sm font-medium">تغيير كلمة مرور الحماية</p>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              كلمة المرور هذه تُستخدم لحماية الإعدادات الحساسة في النظام
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>كلمة المرور الحالية</Label>
            <div className="relative">
              <Input 
                type={showCurrentPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input 
                type={showNewPassword ? "text" : "password"}
                placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>تأكيد كلمة المرور الجديدة</Label>
            <Input 
              type="password"
              placeholder="أعد إدخال كلمة المرور الجديدة"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>
          
          {passwordChangeError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {passwordChangeError}
            </p>
          )}
          
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmNewPassword}
          >
            <Key className="h-4 w-4 ml-2" />
            تغيير كلمة المرور
          </Button>
        </TabsContent>
      </Tabs>

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
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
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
