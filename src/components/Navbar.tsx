import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useLicenseContext } from "@/contexts/LicenseContext";
import ThemeToggle from "@/components/ThemeToggle";
import ColorCustomizer from "@/components/ColorCustomizer";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { schoolName, schoolLogo } = useLicenseContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatArabicDate = (date: Date) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = days[date.getDay()];
    
    const formattedDate = date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return { dayName, formattedDate, formattedTime };
  };

  const { dayName, formattedDate, formattedTime } = formatArabicDate(currentTime);

  return (
    <nav className="bg-primary dark:bg-gray-900 text-primary-foreground p-4 shadow-md dir-rtl border-b border-primary-foreground/10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          {schoolLogo && (
            <img 
              src={schoolLogo} 
              alt="شعار المدرسة" 
              className="h-10 w-10 rounded-full object-cover border-2 border-primary-foreground/30 shadow-sm"
            />
          )}
          <h1 className="text-xl font-bold">{schoolName || "نظام تحليل الاختبارات"}</h1>
          <span className="hidden md:inline text-sm opacity-90">نظام تحليل نتائج الاختبارات</span>
        </div>

        {/* DateTime Display */}
        <div className="hidden lg:flex items-center gap-3 bg-primary-foreground/10 rounded-lg px-4 py-2">
          <Clock className="h-4 w-4 opacity-80" />
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{dayName}</span>
            <span className="opacity-70">|</span>
            <span>{formattedDate}</span>
            <span className="opacity-70">|</span>
            <span className="font-mono tabular-nums">{formattedTime}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <SyncStatusIndicator />
          <ThemeToggle />
          <ColorCustomizer />
          <Button 
            variant="secondary" 
            size="sm"
            className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={() => navigate("/admin-dashboard")}
          >
            لوحة التحكم
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="border-white/30 text-white hover:bg-white/20 dark:border-gray-600"
            onClick={() => {
              toast({
                title: "تسجيل الخروج",
                description: "تم تسجيل الخروج بنجاح",
              });
              navigate("/");
            }}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
