import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette, Check } from "lucide-react";
import { useColorStore, defaultThemes, ColorTheme } from "@/stores/colorStore";
import { motion } from "framer-motion";
import { useEffect } from "react";

const ColorCustomizer = () => {
  const { currentTheme, setTheme, applyTheme } = useColorStore();

  // Apply theme on mount
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const getPreviewStyle = (theme: ColorTheme) => ({
    background: `linear-gradient(135deg, hsl(${theme.primary}) 0%, hsl(${theme.accent}) 100%)`,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
          >
            <Palette className="h-5 w-5 text-foreground" />
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-center mb-4">تخصيص الألوان</h4>
          <div className="grid grid-cols-2 gap-2">
            {defaultThemes.map((theme) => (
              <motion.button
                key={theme.id}
                onClick={() => setTheme(theme)}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  currentTheme.id === theme.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="w-full h-8 rounded-md mb-2"
                  style={getPreviewStyle(theme)}
                />
                <span className="text-xs font-medium">{theme.name}</span>
                {currentTheme.id === theme.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5"
                  >
                    <Check className="h-3 w-3" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorCustomizer;
