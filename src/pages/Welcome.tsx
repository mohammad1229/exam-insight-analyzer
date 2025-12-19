import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import SystemLogo from "@/components/SystemLogo";
import ThemeToggle from "@/components/ThemeToggle";
import ParticlesBackground from "@/components/ParticlesBackground";
import { motion } from "framer-motion";

const Welcome = () => {
  const [progress, setProgress] = useState(0);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Load school name from localStorage
  useEffect(() => {
    const storedSchoolName = localStorage.getItem("schoolName");
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
    }
  }, []);

  // Play completion sound
  const playCompletionSound = () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;
      
      // Create a pleasant chime sound
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      // Play a pleasant ascending chime
      playTone(523.25, now, 0.3);        // C5
      playTone(659.25, now + 0.1, 0.3);  // E5
      playTone(783.99, now + 0.2, 0.4);  // G5
      playTone(1046.50, now + 0.3, 0.5); // C6
      
    } catch (error) {
      console.log("Audio not supported");
    }
  };
  
  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          // Play sound when complete
          playCompletionSound();
          setTimeout(() => {
            navigate("/");
          }, 800);
          return 100;
        }
        return prevProgress + 1;
      });
    }, 30); // Complete in about 3 seconds
    
    return () => {
      clearInterval(timer);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [navigate]);
  
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-secondary via-background to-accent dir-rtl relative overflow-hidden dark:from-black dark:via-gray-900 dark:to-green-900"
    >
      {/* خلفية الجسيمات */}
      <ParticlesBackground particleCount={60} />

      {/* زر تبديل الوضع */}
      <div className="absolute top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {/* تأثير التوهج */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="text-center space-y-6 max-w-4xl px-4 relative z-10">
        {/* الشعار المتحرك */}
        <SystemLogo size={160} className="mx-auto" />
        
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-primary dark:text-red-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          نظام تحليل نتائج الاختبارات المدرسية
        </motion.h1>
        
        {/* اسم المدرسة المرخصة */}
        {schoolName && (
          <motion.div
            className="bg-white/20 dark:bg-black/30 backdrop-blur-sm rounded-lg px-6 py-3 inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <p className="text-xl md:text-2xl font-semibold text-accent dark:text-green-400">
              🏫 {schoolName}
            </p>
          </motion.div>
        )}
        
        <motion.p 
          className="text-xl text-foreground/80 dark:text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          أهلا بكم في النظام الشامل لإدارة وتحليل نتائج اختبارات الطلاب وإصدار التقارير الإحصائية
        </motion.p>
        
        <motion.div 
          className="w-full max-w-md mx-auto space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <div className="flex justify-between text-sm mb-1 text-foreground dark:text-gray-300">
            <span>جاري تحميل النظام...</span>
            <span className="font-bold">{progress}%</span>
          </div>
          
          <div className="relative h-4 w-full bg-white/30 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
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
            {/* تأثير البريق */}
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: [-80, 400],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
          
          {progress === 100 && (
            <motion.p
              className="text-accent dark:text-green-400 font-semibold text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              ✓ تم التحميل بنجاح!
            </motion.p>
          )}
        </motion.div>
        
        <motion.div 
          className="pt-6 text-sm text-foreground/70 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.5 }}
        >
          <p>تم تطويره بواسطة محمد الشوامرة للبرمجة والتصميم</p>
          <p>0566000140</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
