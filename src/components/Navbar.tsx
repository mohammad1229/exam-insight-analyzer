import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { schoolData } from "@/data/mockData";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <nav className="bg-primary dark:bg-gray-900 text-primary-foreground p-4 shadow-md dir-rtl border-b border-primary-foreground/10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-xl font-bold">{schoolData.name}</h1>
          <span className="hidden md:inline text-sm opacity-90">نظام تحليل نتائج الاختبارات</span>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button 
            variant="secondary" 
            size="sm"
            className="dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            onClick={() => navigate("/admin")}
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
