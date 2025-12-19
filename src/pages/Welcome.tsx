import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import SystemLogo from "@/components/SystemLogo";
import ThemeToggle from "@/components/ThemeToggle";
import { motion } from "framer-motion";

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
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-secondary via-background to-accent dir-rtl relative overflow-hidden dark:from-black dark:via-gray-900 dark:to-green-900"
      style={{ 
        background: "linear-gradient(180deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 50%, hsl(var(--accent)) 100%)"
      }}
    >
      {/* زر تبديل الوضع */}
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* تأثير الخلفية */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-accent/10 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
        />
      </div>

      <div className="text-center space-y-8 max-w-4xl px-4 relative z-10">
        {/* الشعار المتحرك */}
        <SystemLogo size={160} className="mx-auto" />
        
        <motion.h1 
          className="text-5xl font-bold text-primary dark:text-red-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          نظام تحليل نتائج الاختبارات المدرسية
        </motion.h1>
        
        <motion.p 
          className="text-2xl text-foreground/80 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          أهلا بكم في النظام الشامل لإدارة وتحليل نتائج اختبارات الطلاب وإصدار التقارير الإحصائية
        </motion.p>
        
        <motion.div 
          className="w-full max-w-md mx-auto space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="flex justify-between text-sm mb-1 text-foreground dark:text-gray-300">
            <span>جاري تحميل النظام...</span>
            <span className="font-bold">{progress}%</span>
          </div>
          
          <div className="relative h-3 w-full bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(to right, hsl(var(--secondary)) 0%, hsl(var(--primary)) 50%, hsl(var(--accent)) 100%)",
                width: `${progress}%`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="pt-6 text-sm text-foreground/70 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <p>تم تطويره بواسطة محمد الشوامرة للبرمجة والتصميم</p>
          <p>0566000140</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
