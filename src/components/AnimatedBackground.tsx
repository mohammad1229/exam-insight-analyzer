import { ReactNode } from "react";
import { motion } from "framer-motion";
import ParticlesBackground from "./ParticlesBackground";

interface AnimatedBackgroundProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "purple" | "dark";
}

const AnimatedBackground = ({ 
  children, 
  className = "",
  variant = "default" 
}: AnimatedBackgroundProps) => {
  const getGradientClass = () => {
    switch (variant) {
      case "purple":
        return "from-slate-900 via-purple-900 to-slate-900";
      case "dark":
        return "from-gray-950 via-gray-900 to-gray-950";
      default:
        return "from-secondary via-background to-accent dark:from-gray-950 dark:via-gray-900 dark:to-gray-950";
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* الخلفية المتدرجة */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()}`}>
        {/* تأثير الشبكة */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* كرات متوهجة */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* الجسيمات */}
      <ParticlesBackground particleCount={40} />

      {/* المحتوى */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AnimatedBackground;
