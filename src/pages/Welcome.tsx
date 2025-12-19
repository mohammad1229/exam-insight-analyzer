import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import SystemLogo from "@/components/SystemLogo";
import ThemeToggle from "@/components/ThemeToggle";
import ParticlesBackground from "@/components/ParticlesBackground";
import ColorCustomizer from "@/components/ColorCustomizer";
import PageTransition from "@/components/PageTransition";
import { motion } from "framer-motion";
import { useColorStore } from "@/stores/colorStore";

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
  
  // Apply saved color theme
  const { applyTheme } = useColorStore();
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);
  
  return (
    <PageTransition className="min-h-screen">
      <div 
        className="min-h-screen flex flex-col items-center justify-center dir-rtl relative overflow-hidden"
      >
        {/* خلفية متحركة مثل صفحة الترخيص */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          {/* تأثير الشبكة */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* كرات متوهجة */}
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* الجسيمات */}
        <ParticlesBackground particleCount={50} colors={["#E84C3D", "#34A853", "#9333ea", "#ffffff"]} />

        {/* أزرار التحكم */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <ThemeToggle />
          <ColorCustomizer />
        </div>

      <div className="text-center space-y-6 max-w-4xl px-4 relative z-10">
        {/* الشعار المتحرك */}
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <SystemLogo size={130} className="mx-auto" />
        </motion.div>
        
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          نظام تحليل نتائج الاختبارات المدرسية
        </motion.h1>
        
        {/* اسم المدرسة المرخصة */}
        {schoolName && (
          <motion.div
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-6 py-3 inline-block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-xl md:text-2xl font-semibold text-accent">
              🏫 {schoolName}
            </p>
          </motion.div>
        )}
        
        <motion.p 
          className="text-xl text-gray-300"
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
          <div className="flex justify-between text-sm mb-1 text-white">
            <span>جاري تحميل النظام...</span>
            <span className="font-bold">{progress}%</span>
          </div>
          
          <div className="relative h-4 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
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
              className="text-accent font-semibold text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              ✓ تم التحميل بنجاح!
            </motion.p>
          )}
        </motion.div>
        
        <motion.div 
          className="pt-6 text-sm text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <p>تم تطويره بواسطة محمد الشوامرة للبرمجة والتصميم</p>
          <p>0566000140</p>
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Welcome;
