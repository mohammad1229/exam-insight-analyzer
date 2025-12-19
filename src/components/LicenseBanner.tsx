import { useLicenseContext } from "@/contexts/LicenseContext";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, User } from "lucide-react";
import { motion } from "framer-motion";

const LicenseBanner = () => {
  const { isActivated, isTrial, schoolName, directorName, remainingDays } = useLicenseContext();

  if (!isActivated) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white py-2 px-4 flex items-center justify-between text-sm backdrop-blur-sm border-b border-white/10"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <Badge 
            variant="secondary" 
            className={`${isTrial ? 'bg-yellow-500/20 text-yellow-200' : 'bg-green-500/20 text-green-200'}`}
          >
            {isTrial ? 'نسخة تجريبية' : 'نسخة مرخصة'}
          </Badge>
        </div>
        
        {schoolName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="font-semibold">{schoolName}</span>
          </div>
        )}
        
        {directorName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-white/80">{directorName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs opacity-80">
        <span>متبقي {remainingDays} يوم</span>
      </div>
    </motion.div>
  );
};

export default LicenseBanner;
