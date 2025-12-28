"use client";

import { motion } from "framer-motion";
import { PaperAnalysis } from "@/lib/gemini";
import { Beaker, ChevronRight, BrainCircuit, Activity } from "lucide-react";
import clsx from "clsx";

interface AnalysisPanelProps {
  analysis: PaperAnalysis | null;
  onSimulate: (sim: PaperAnalysis["simulation_possibilities"][0]) => void;
}

export default function AnalysisPanel({ analysis, onSimulate }: AnalysisPanelProps) {
  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      {/* Left Column: Paper Info */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-sm uppercase tracking-wider text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Paper Analysis
          </h2>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400 mb-4">
            {analysis.title}
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <h3 className="text-sm uppercase tracking-wider text-emerald-400 font-semibold mb-3">
             Key Claims
          </h3>
          <ul className="space-y-3">
            {analysis.key_claims.map((claim, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-300">
                 <span className="text-emerald-500/50 font-mono">0{idx + 1}</span>
                 {claim}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column: Simulation Options */}
      <div className="md:col-span-2 space-y-4">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          Available Prototypes
        </h2>
        
        <div className="grid gap-4">
          {analysis.simulation_possibilities.map((sim, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.01 }}
              className="glass-panel p-6 rounded-xl cursor-pointer group hover:border-purple-500/50 transition-colors"
              onClick={() => onSimulate(sim)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {sim.title}
                </h3>
                <span className={clsx(
                  "px-2 py-0.5 rounded text-xs font-mono border",
                  sim.complexity === "High" ? "border-red-500/30 text-red-400 bg-red-500/10" :
                  sim.complexity === "Medium" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
                  "border-blue-500/30 text-blue-400 bg-blue-500/10"
                )}>
                  {sim.complexity} Complex
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">{sim.description}</p>
              
              <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-4">
                 <div className="flex gap-2">
                    {sim.variables.slice(0, 3).map((v, i) => (
                      <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">
                        {v}
                      </span>
                    ))}
                    {sim.variables.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">+{sim.variables.length - 3} more</span>
                    )}
                 </div>
                 {/* ID is mocked here, normally would be from DB or just passing params via URL state */}
                 <a 
                   href={`/prototype/sim-${Date.now()}?title=${encodeURIComponent(sim.title)}&description=${encodeURIComponent(sim.description)}`}
                   className="flex items-center gap-1 text-sm text-purple-400 font-medium group-hover:translate-x-1 transition-transform"
                   onClick={(e) => { e.stopPropagation(); }}
                 >
                   Compile <ChevronRight className="w-4 h-4" />
                 </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
