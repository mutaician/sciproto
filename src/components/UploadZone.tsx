"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import clsx from "clsx";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export default function UploadZone({ onUpload, isAnalyzing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onUpload(e.dataTransfer.files[0]);
      }
    },
    [onUpload]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 p-1 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl" />
      
      <motion.div
        layout
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 backdrop-blur-sm group",
          isDragging
            ? "border-blue-500 bg-blue-500/10 scale-[1.02]"
            : "border-gray-700 hover:border-blue-400/50 hover:bg-white/5",
          isAnalyzing ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Traveling Sparkle */}
        {!isAnalyzing && (
            <motion.div
                className="absolute w-4 h-4 pointer-events-none"
                animate={{
                    top: ["0%", "0%", "100%", "100%", "0%"],
                    left: ["0%", "100%", "100%", "0%", "0%"],
                    opacity: [0, 1, 1, 1, 0] // Fade in/out at start/end to hide jump? or just loop
                }}
                transition={{
                    duration: 4,
                    ease: "linear",
                    repeat: Infinity,
                    times: [0, 0.25, 0.5, 0.75, 1] 
                }}
                style={{ marginLeft: -8, marginTop: -8 }} // Center on border
            >
                <Sparkles className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] fill-blue-400/50 animate-pulse" />
            </motion.div>
        )}

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className={clsx(
              "p-4 rounded-full transition-all duration-500",
               isDragging ? "bg-blue-500/20" : "bg-white/5"
            )}>
              {isAnalyzing ? (
                 <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              ) : (
                 <Upload className={clsx("w-8 h-8 transition-colors", isDragging ? "text-blue-400" : "text-gray-400")} />
              )}
            </div>
          </div>

          <div className="space-y-2 z-0">
            <h3 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {isAnalyzing ? "Analyzing Quantum Data..." : "Upload Research Paper"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Drag & drop your PDF here, or click to browse.
              <br />
              <span className="text-xs opacity-70">Supports .pdf (Max 20MB)</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Decor */}
      <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 rounded-tl-lg" />
      <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-purple-500/30 rounded-br-lg" />
    </div>
  );
}
