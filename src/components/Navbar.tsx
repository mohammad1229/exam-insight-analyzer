
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { schoolData } from "@/data/mockData";

const Navbar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  return (
    <nav className="bg-primary text-primary-foreground p-4 shadow-md dir-rtl">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <h1 className="text-xl font-bold">{schoolData.name}</h1>
          <span className="hidden md:inline text-sm">نظام تحليل نتائج الاختبارات</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => navigate("/admin")}
          >
            لوحة التحكم
          </Button>
          <Button 
            variant="outline" 
            size="sm"
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
