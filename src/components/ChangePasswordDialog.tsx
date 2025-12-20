import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

interface ChangePasswordDialogProps {
  open: boolean;
  adminId: string;
  isForced?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

// Password validation schema
const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Za-z]/, "يجب أن تحتوي على حرف واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  adminId,
  isForced = false,
  onSuccess,
  onClose
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const validateForm = (): boolean => {
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: { newPassword?: string; confirmPassword?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "newPassword") {
            formErrors.newPassword = err.message;
          } else if (err.path[0] === "confirmPassword") {
            formErrors.confirmPassword = err.message;
          }
        });
        setErrors(formErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('change_admin_password', {
        p_admin_id: adminId,
        p_new_password: newPassword
      });

      if (error) {
        throw error;
      }

      if (data && typeof data === 'object' && 'success' in data) {
        if (data.success) {
          toast.success("تم تغيير كلمة المرور بنجاح");
          setNewPassword("");
          setConfirmPassword("");
          onSuccess();
        } else {
          toast.error((data as any).error || "فشل في تغيير كلمة المرور");
        }
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isForced && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => isForced && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isForced ? "تغيير كلمة المرور مطلوب" : "تغيير كلمة المرور"}
          </DialogTitle>
          <DialogDescription>
            {isForced 
              ? "هذه أول مرة تسجل فيها الدخول. يجب عليك تغيير كلمة المرور للمتابعة."
              : "أدخل كلمة المرور الجديدة لتحديث حسابك."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 pl-10"
                placeholder="أدخل كلمة المرور الجديدة"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              8 أحرف على الأقل، تحتوي على حروف وأرقام
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10"
                placeholder="أعد إدخال كلمة المرور"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {!isForced && onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "جاري التغيير..." : "تغيير كلمة المرور"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
