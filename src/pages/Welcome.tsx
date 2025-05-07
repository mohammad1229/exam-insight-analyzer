
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const Welcome = () => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            navigate("/");
          }, 500);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 30); // Complete in about 3 seconds
    
    return () => {
      clearInterval(timer);
    };
  }, [navigate]);
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-white to-green-600 dir-rtl"
      style={{ 
        background: "linear-gradient(180deg, #000000 0%, #ffffff 50%, #34A853 100%)"
      }}
    >
      <div className="text-center space-y-8 max-w-4xl px-4">
        <img 
          src="/placeholder.svg" 
          alt="شعار نظام تحليل نتائج الاختبارات المدرسية" 
          className="w-32 h-32 mx-auto"
        />
        
        <h1 className="text-5xl font-bold text-[#E84c3d]">
          نظام تحليل نتائج الاختبارات المدرسية
        </h1>
        
        <p className="text-2xl text-black">
          أهلا بكم في النظام الشامل لإدارة وتحليل نتائج اختبارات الطلاب وإصدار التقارير الإحصائية
        </p>
        
        <div className="w-full max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm mb-1">
            <span>جاري تحميل النظام...</span>
            <span className="font-bold">{progress}%</span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2 w-full bg-white"
            style={{ 
              "--progress-background": "linear-gradient(to right, #000 0%, #E84c3d 50%, #34A853 100%)",
            } as any}
          />
        </div>
        
        <div className="pt-6 text-sm text-black">
          <p>تم تطويره بواسطة محمد الشوامرة للبرمجة والتصميم</p>
          <p>0566000140</p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
