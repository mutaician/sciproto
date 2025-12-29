"use client";

import { motion } from "framer-motion";
import { PaperAnalysis } from "@/lib/gemini";
import { Beaker, ChevronRight, BrainCircuit, Activity, Sparkles, FileText, Layers, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface AnalysisPanelProps {
  analysis: PaperAnalysis | null;
  onSimulate: (sim: PaperAnalysis["simulation_possibilities"][0]) => void;
  onReanalyze: () => void;
  onBack: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AnalysisPanel({ analysis, onSimulate, onReanalyze, onBack }: AnalysisPanelProps) {
  if (!analysis) return null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      {/* HEADER SECTION - Full Width */}
      <motion.div variants={item} className="lg:col-span-12 glass-panel p-8 rounded-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-wider">
                <Activity className="w-3 h-3" />
                ANALYSIS COMPLETE
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 tracking-tight leading-tight">
                {analysis.title}
              </h1>
              <p className="text-lg text-gray-300 leading-relaxed border-l-2 border-blue-500/30 pl-4">
                {analysis.summary}
              </p>
            </div>
            
             {/* Quick Stats or Metrics */}
            <div className="flex gap-4 items-center">
              <button 
                 onClick={onBack}
                 className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-gray-300 font-medium"
              >
                  ← Back
              </button>
              
              <button 
                 onClick={onReanalyze}
                 className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/refresh"
                 title="Force Re-analysis"
              >
                  <RefreshCw className="w-5 h-5 text-gray-400 group-hover/refresh:rotate-180 transition-transform duration-500" />
              </button>

              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                 <div className="text-2xl font-bold text-emerald-400">{analysis.key_claims.length}</div>
                 <div className="text-xs text-gray-400 uppercase tracking-widest">Claims</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                 <div className="text-2xl font-bold text-purple-400">{analysis.simulation_possibilities.length}</div>
                 <div className="text-xs text-gray-400 uppercase tracking-widest">Protos</div>
              </div>
            </div>
          </div>
      </motion.div>

      {/* LEFT COLUMN - Key Claims */}
      <motion.div variants={item} className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-2xl h-full border-t-4 border-emerald-500/50">
          <h2 className="text-sm uppercase tracking-wider text-emerald-400 font-bold mb-6 flex items-center gap-2">
             <FileText className="w-4 h-4" />
             Core Insights
          </h2>
          <ul className="space-y-4">
            {analysis.key_claims.map((claim, idx) => (
              <motion.li 
                key={idx} 
                whileHover={{ x: 4 }}
                className="flex gap-4 text-sm text-gray-300 group cursor-default"
              >
                 <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-mono text-xs border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                   {idx + 1}
                 </span>
                 <span className="leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                   {claim}
                 </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* RIGHT COLUMN - Simulations Grid */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <motion.h2 variants={item} className="text-lg font-medium text-white flex items-center gap-2 px-2">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          Recommended Prototypes
        </motion.h2>
        
        <div className="grid grid-cols-1 gap-4">
          {analysis.simulation_possibilities.map((sim, idx) => (
            <motion.div
              variants={item}
              key={idx}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(30,30,40,0.8)" }}
              whileTap={{ scale: 0.98 }}
              className="glass-panel p-6 rounded-2xl cursor-pointer group hover:border-purple-500/50 transition-all relative overflow-hidden"
              onClick={() => onSimulate(sim)}
            >
              <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-24 h-24 text-purple-500 transform rotate-12 translate-x-4 -translate-y-4" />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 transition-all">
                    {sim.title}
                  </h3>
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-xs font-bold tracking-wider border",
                    sim.complexity === "High" ? "border-red-500/30 text-red-400 bg-red-500/10" :
                    sim.complexity === "Medium" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                    "border-blue-500/30 text-blue-400 bg-blue-500/10"
                  )}>
                    {sim.complexity}
                  </span>
                </div>
                
                <p className="text-gray-400 mb-6 max-w-xl group-hover:text-gray-300 transition-colors">
                  {sim.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
                   <div className="flex flex-wrap gap-2">
                      <Layers className="w-4 h-4 text-gray-500 mr-1" />
                      {sim.variables.slice(0, 4).map((v, i) => (
                        <span key={i} className="text-xs bg-white/5 border border-white/5 px-2 py-1 rounded text-gray-400 font-mono">
                          {v}
                        </span>
                      ))}
                      {sim.variables.length > 4 && (
                        <span className="text-xs px-2 py-1 text-gray-600">+{sim.variables.length - 4}</span>
                      )}
                   </div>
                   
                   <button 
                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors group/btn"
                   >
                     Initialize <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
