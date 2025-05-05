
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-edu-primary to-edu-secondary flex flex-col items-center justify-center text-white dir-rtl px-4">
      <div className="space-y-6 text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          نظام تحليل نتائج الاختبارات المدرسية
        </h1>
        
        <p className="text-xl md:text-2xl opacity-90">
          منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
        </p>
        
        <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-white text-edu-primary hover:bg-gray-100"
            onClick={() => navigate("/dashboard")}
          >
            الدخول إلى النظام
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-white text-white hover:bg-white hover:text-edu-primary"
            onClick={() => navigate("/admin")}
          >
            لوحة التحكم
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-sm opacity-80">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
        <p>0566000140</p>
      </div>
    </div>
  );
};

export default Index;
