import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { getStoredLicense } from "@/services/licenseService";
import { Sparkles, Quote } from "lucide-react";

interface Wisdom {
  id: string;
  content: string;
  author: string | null;
  category: string;
}

const WisdomBanner = () => {
  const [wisdoms, setWisdoms] = useState<Wisdom[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const loadWisdoms = useCallback(async () => {
    try {
      const license = getStoredLicense();
      const schoolId = license?.schoolId;

      const { data, error } = await supabase.functions.invoke("manage-wisdoms", {
        body: { action: "get", schoolId },
      });

      if (error) throw error;

      if (data?.success && data.wisdoms?.length > 0) {
        setWisdoms(data.wisdoms);
      } else {
        // Default wisdoms if none exist
        setWisdoms([
          { id: "1", content: "العلم نور والجهل ظلام", author: null, category: "general" },
          { id: "2", content: "من جد وجد ومن زرع حصد", author: null, category: "general" },
          { id: "3", content: "اطلبوا العلم من المهد إلى اللحد", author: null, category: "general" },
          { id: "4", content: "خير الناس أنفعهم للناس", author: null, category: "general" },
          { id: "5", content: "الصبر مفتاح الفرج", author: null, category: "general" },
        ]);
      }
    } catch (error) {
      console.error("Error loading wisdoms:", error);
      // Use default wisdoms on error
      setWisdoms([
        { id: "1", content: "العلم نور والجهل ظلام", author: null, category: "general" },
        { id: "2", content: "من جد وجد ومن زرع حصد", author: null, category: "general" },
      ]);
    }
  }, []);

  useEffect(() => {
    loadWisdoms();
  }, [loadWisdoms]);

  useEffect(() => {
    if (wisdoms.length === 0) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % wisdoms.length);
        setIsVisible(true);
      }, 500);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [wisdoms.length]);

  if (wisdoms.length === 0) return null;

  const currentWisdom = wisdoms[currentIndex];

  return (
    <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white py-2 px-4 shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-white rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key={currentWisdom.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-3 text-center"
            >
              <Quote className="h-5 w-5 flex-shrink-0 rotate-180" />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-200" />
                <span className="text-sm md:text-base font-medium">
                  {currentWisdom.content}
                </span>
                {currentWisdom.author && (
                  <span className="text-xs md:text-sm opacity-80">
                    — {currentWisdom.author}
                  </span>
                )}
                <Sparkles className="h-4 w-4 text-yellow-200" />
              </div>
              <Quote className="h-5 w-5 flex-shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <motion.div
          className="h-full bg-white/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          key={currentIndex}
        />
      </div>
    </div>
  );
};

export default WisdomBanner;
