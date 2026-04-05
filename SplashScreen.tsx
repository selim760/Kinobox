import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Play } from "lucide-react";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => onFinish(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated glow rings */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full border border-primary/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-[200px] h-[200px] rounded-full border border-cinema-gold/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3], opacity: [0.3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10 flex flex-col items-center"
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-[0_0_40px_hsl(var(--primary)/0.4)]"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Play className="h-10 w-10 text-primary-foreground fill-current" />
          </motion.div>

          <h1 className="font-display text-5xl sm:text-6xl tracking-wider text-gradient-red">
            KinoBox
          </h1>

          {phase >= 1 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-muted-foreground text-sm mt-3"
            >
              Лучший кинотеатр онлайн
            </motion.p>
          )}

          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-cinema-gold/30 bg-cinema-gold/5"
            >
              <Crown className="h-4 w-4 text-cinema-gold" />
              <span className="text-cinema-gold text-xs font-medium">Premium Experience</span>
            </motion.div>
          )}
        </motion.div>

        {/* Loading bar */}
        <motion.div className="absolute bottom-16 w-48 h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-cinema-gold rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
