import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

// Steps for the loading effect
const LOADING_STEPS = [
  "Deep Scanning Research Paper...",
  "Extracting Core Equations...",
  "Identifying Simulation Variables...",
  "Synthesizing Prototype Architecture...",
  "Optimizing Render Logic...",
  "Finalizing Agent Instruction Set..."
];

export default function AnalyzingOverlay({ isAnalyzing }: { isAnalyzing: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isAnalyzing) {
      setStepIndex(0);
      return;
    }

    // Cycle through steps
    const stepInterval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    // Animated dots ...
    const dotInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(dotInterval);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="absolute inset-0 z-50 rounded-2xl overflow-hidden bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center border border-white/10">
      
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-blue-500/5 animate-pulse-slow"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md w-full px-6">
        
        {/* Animated Icon Container */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-xl animate-pulse rounded-full"></div>
          <div className="relative bg-black border border-white/10 p-6 rounded-2xl shadow-2xl">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              <div className="absolute top-0 right-0 -mt-2 -mr-2">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-bounce" />
              </div>
          </div>
        </div>

        {/* Text Status */}
        <div className="text-center space-y-2 h-20">
            <AnimatePresence mode="wait">
                <motion.h3 
                    key={stepIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                >
                    {LOADING_STEPS[stepIndex]}
                </motion.h3>
            </AnimatePresence>
            <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">
                Processing {dots}
            </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
               className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
               initial={{ width: "0%" }}
               animate={{ width: "100%" }}
               transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
        </div>

      </div>
    </div>
  );
}

