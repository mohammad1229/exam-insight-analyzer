
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-white to-green-600 flex flex-col items-center justify-center text-white dir-rtl px-4">
      <div className="space-y-6 text-center max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#ea384c]">
          نظام تحليل نتائج الاختبارات المدرسية
        </h1>
        
        <p className="text-xl md:text-2xl text-black font-medium">
          منصة متكاملة لإدارة وتحليل نتائج الاختبارات وإصدار التقارير الإحصائية
        </p>
        
        <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-black text-white hover:bg-gray-800"
            onClick={() => navigate("/teacher-login")}
          >
            دخول المعلمين
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-[#ea384c] text-[#ea384c] hover:bg-[#ea384c] hover:text-white"
            onClick={() => navigate("/admin")}
          >
            لوحة تحكم المدير
          </Button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-center text-sm text-black">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد الشوامرة للبرمجة والتصميم</p>
        <p>0566000140</p>
      </div>
    </div>
  );
};

export default Index;
