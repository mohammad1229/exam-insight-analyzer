import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LicenseExpiryWarningProps {
  remainingDays: number;
  isTrial: boolean;
  onDismiss?: () => void;
}

const LicenseExpiryWarning = ({ remainingDays, isTrial, onDismiss }: LicenseExpiryWarningProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || remainingDays > 7) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const getUrgencyColor = () => {
    if (remainingDays <= 2) return "bg-red-600";
    if (remainingDays <= 5) return "bg-orange-500";
    return "bg-yellow-500";
  };

  const getMessage = () => {
    if (isTrial) {
      if (remainingDays === 0) {
        return "انتهت الفترة التجريبية! يرجى تفعيل الترخيص للاستمرار.";
      }
      return `متبقي ${remainingDays} ${remainingDays === 1 ? "يوم" : "أيام"} على انتهاء الفترة التجريبية`;
    }
    if (remainingDays === 0) {
      return "انتهى الترخيص! يرجى التجديد للاستمرار.";
    }
    return `متبقي ${remainingDays} ${remainingDays === 1 ? "يوم" : "أيام"} على انتهاء الترخيص`;
  };

  return (
    <div className={`${getUrgencyColor()} text-white py-2 px-4 flex items-center justify-between dir-rtl`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 animate-pulse" />
        <span className="font-medium">{getMessage()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => window.location.href = "/system-admin"}
        >
          تجديد الترخيص
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default LicenseExpiryWarning;
