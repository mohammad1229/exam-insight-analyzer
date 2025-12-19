import { motion } from "framer-motion";

interface SystemLogoProps {
  size?: number;
  className?: string;
}

const SystemLogo = ({ size = 128, className = "" }: SystemLogoProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        duration: 0.8 
      }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
      >
        {/* الخلفية الدائرية */}
        <motion.circle
          cx="64"
          cy="64"
          r="60"
          fill="url(#bgGradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        
        {/* الحلقة الخارجية */}
        <motion.circle
          cx="64"
          cy="64"
          r="56"
          stroke="url(#ringGradient)"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 1.5, ease: "easeInOut" }}
          style={{ transformOrigin: "center" }}
        />

        {/* الكتاب المفتوح */}
        <motion.g
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {/* صفحة اليسار */}
          <motion.path
            d="M64 45 L35 50 L35 85 L64 80 Z"
            fill="#ffffff"
            stroke="#1a1a1a"
            strokeWidth="2"
            initial={{ rotateY: -30 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          />
          {/* صفحة اليمين */}
          <motion.path
            d="M64 45 L93 50 L93 85 L64 80 Z"
            fill="#f8f8f8"
            stroke="#1a1a1a"
            strokeWidth="2"
            initial={{ rotateY: 30 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          />
          {/* خط الوسط */}
          <motion.line
            x1="64"
            y1="45"
            x2="64"
            y2="80"
            stroke="#333"
            strokeWidth="2"
          />
        </motion.g>

        {/* رمز الرسم البياني */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {/* الأعمدة */}
          <motion.rect
            x="42"
            y="58"
            width="8"
            height="18"
            rx="2"
            fill="#E84C3D"
            initial={{ height: 0, y: 76 }}
            animate={{ height: 18, y: 58 }}
            transition={{ delay: 1.2, duration: 0.4 }}
          />
          <motion.rect
            x="54"
            y="52"
            width="8"
            height="24"
            rx="2"
            fill="#34A853"
            initial={{ height: 0, y: 76 }}
            animate={{ height: 24, y: 52 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          />
          <motion.rect
            x="66"
            y="55"
            width="8"
            height="21"
            rx="2"
            fill="#E84C3D"
            initial={{ height: 0, y: 76 }}
            animate={{ height: 21, y: 55 }}
            transition={{ delay: 1.6, duration: 0.4 }}
          />
          <motion.rect
            x="78"
            y="48"
            width="8"
            height="28"
            rx="2"
            fill="#34A853"
            initial={{ height: 0, y: 76 }}
            animate={{ height: 28, y: 48 }}
            transition={{ delay: 1.8, duration: 0.4 }}
          />
        </motion.g>

        {/* نجمة النجاح */}
        <motion.path
          d="M64 22 L66.5 29 L74 29 L68 34 L70 41 L64 37 L58 41 L60 34 L54 29 L61.5 29 Z"
          fill="#FFD700"
          stroke="#E8A800"
          strokeWidth="1"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 2, duration: 0.5, type: "spring" }}
        />

        {/* التدرجات */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="50%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#2a2a2a" />
          </linearGradient>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E84C3D" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#34A853" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* تأثير التوهج */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(232, 76, 61, 0.3) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

export default SystemLogo;
