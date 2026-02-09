"use client";

import { motion } from "framer-motion";
import { PaperAnalysis } from "@/lib/gemini";
import { 
  Beaker, ChevronRight, BrainCircuit, Activity, Sparkles, FileText, 
  Layers, RefreshCw, TrendingUp, Lightbulb, FlaskConical, BookOpen,
  Target, AlertTriangle, Zap, GraduationCap
} from "lucide-react";
import clsx from "clsx";

interface AnalysisPanelProps {
  analysis: PaperAnalysis | null;
  onSimulate: (sim: PaperAnalysis["simulation_possibilities"][0], index: number) => void;
  onReanalyze?: () => void;
  onBack: () => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Breakthrough score color and label
function getBreakthroughStyle(score: number) {
  if (score >= 90) return { color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", label: "Revolutionary" };
  if (score >= 70) return { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", label: "Significant" };
  if (score >= 50) return { color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", label: "Solid" };
  if (score >= 30) return { color: "text-orange-400", bg: "bg-orange-500/20", border: "border-orange-500/30", label: "Minor" };
  return { color: "text-gray-400", bg: "bg-gray-500/20", border: "border-gray-500/30", label: "Limited" };
}

function getDifficultyStyle(difficulty: string) {
  switch (difficulty) {
    case "Beginner": return { color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "Intermediate": return { color: "text-blue-400", bg: "bg-blue-500/10" };
    case "Advanced": return { color: "text-amber-400", bg: "bg-amber-500/10" };
    case "Expert": return { color: "text-red-400", bg: "bg-red-500/10" };
    default: return { color: "text-gray-400", bg: "bg-gray-500/10" };
  }
}

export default function AnalysisPanel({ analysis, onSimulate, onReanalyze, onBack }: AnalysisPanelProps) {
  if (!analysis) return null;

  const breakthroughStyle = getBreakthroughStyle(analysis.breakthrough_score);
  const difficultyStyle = getDifficultyStyle(analysis.difficulty_to_understand);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto mt-8 space-y-6"
    >
      {/* HEADER SECTION - Full Width */}
      <motion.div variants={item} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button 
                   onClick={onBack}
                   className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-gray-300 font-medium"
                >
                    ← Back
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono tracking-wider">
                  <Activity className="w-3 h-3" />
                  ANALYSIS COMPLETE
                </div>
                <span className={clsx("px-3 py-1 rounded-full text-xs font-medium", difficultyStyle.bg, difficultyStyle.color)}>
                  {analysis.difficulty_to_understand}
                </span>
              </div>
              
{onReanalyze && (
              <button 
                 onClick={onReanalyze}
                 className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group/refresh"
                 title="Force Re-analysis"
              >
                  <RefreshCw className="w-5 h-5 text-gray-400 group-hover/refresh:rotate-180 transition-transform duration-500" />
              </button>
              )}
            </div>

            {/* Title & Summary */}
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 font-mono">{analysis.field}</span>
                  {analysis.publication_year && <span>• {analysis.publication_year}</span>}
                  {analysis.authors.length > 0 && (
                    <span className="truncate max-w-xs">• {analysis.authors.slice(0, 3).join(", ")}{analysis.authors.length > 3 ? " et al." : ""}</span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 tracking-tight leading-tight">
                  {analysis.title}
                </h1>
                
                <p className="text-lg text-gray-300 leading-relaxed border-l-2 border-blue-500/30 pl-4">
                  {analysis.summary}
                </p>

                {/* Related Fields */}
                {analysis.related_fields.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {analysis.related_fields.map((field, i) => (
                      <span key={i} className="px-2 py-1 rounded-lg bg-white/5 text-xs text-gray-400 border border-white/5">
                        {field}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Breakthrough Score Card */}
              <div className={clsx("flex-shrink-0 p-6 rounded-2xl border", breakthroughStyle.bg, breakthroughStyle.border)}>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <TrendingUp className={clsx("w-5 h-5", breakthroughStyle.color)} />
                    <span className="text-xs uppercase tracking-widest text-gray-400">Breakthrough Score</span>
                  </div>
                  <div className={clsx("text-5xl font-bold", breakthroughStyle.color)}>
                    {analysis.breakthrough_score}
                  </div>
                  <div className={clsx("text-sm font-medium", breakthroughStyle.color)}>
                    {breakthroughStyle.label}
                  </div>
                  <p className="text-xs text-gray-400 max-w-[200px] mt-3 leading-relaxed">
                    {analysis.breakthrough_reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-emerald-400">{analysis.key_claims.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Claims</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-blue-400">{analysis.testable_hypotheses.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Hypotheses</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-amber-400">{analysis.key_equations.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Equations</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-purple-400">{analysis.simulation_possibilities.length}</div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Prototypes</div>
              </div>
            </div>
          </div>
      </motion.div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Key Claims */}
          <motion.div variants={item} className="glass-panel p-6 rounded-2xl border-t-4 border-emerald-500/50">
            <h2 className="text-sm uppercase tracking-wider text-emerald-400 font-bold mb-6 flex items-center gap-2">
               <FileText className="w-4 h-4" />
               Key Claims
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
          </motion.div>

          {/* Testable Hypotheses */}
          {analysis.testable_hypotheses.length > 0 && (
            <motion.div variants={item} className="glass-panel p-6 rounded-2xl border-t-4 border-blue-500/50">
              <h2 className="text-sm uppercase tracking-wider text-blue-400 font-bold mb-6 flex items-center gap-2">
                 <Target className="w-4 h-4" />
                 Testable Hypotheses
              </h2>
              <div className="space-y-4">
                {analysis.testable_hypotheses.slice(0, 3).map((hyp, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                    <p className="text-sm text-white font-medium">{hyp.hypothesis}</p>
                    <p className="text-xs text-gray-400">
                      <span className="text-blue-400">Test:</span> {hyp.how_to_test}
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="text-emerald-400">Expected:</span> {hyp.expected_outcome}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Limitations */}
          {analysis.limitations.length > 0 && (
            <motion.div variants={item} className="glass-panel p-6 rounded-2xl border-t-4 border-amber-500/50">
              <h2 className="text-sm uppercase tracking-wider text-amber-400 font-bold mb-6 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" />
                 Limitations
              </h2>
              <ul className="space-y-3">
                {analysis.limitations.map((lim, idx) => (
                  <li key={idx} className="text-sm text-gray-400 flex gap-2">
                    <span className="text-amber-500">•</span>
                    {lim}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Prerequisites */}
          {analysis.prerequisites.length > 0 && (
            <motion.div variants={item} className="glass-panel p-6 rounded-2xl">
              <h2 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-4 flex items-center gap-2">
                 <GraduationCap className="w-4 h-4" />
                 Prerequisites
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.prerequisites.map((prereq, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/5">
                    {prereq}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN - Simulations & Equations */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Equations */}
          {analysis.key_equations.length > 0 && (
            <motion.div variants={item} className="glass-panel p-6 rounded-2xl border-t-4 border-amber-500/50">
              <h2 className="text-sm uppercase tracking-wider text-amber-400 font-bold mb-6 flex items-center gap-2">
                 <FlaskConical className="w-4 h-4" />
                 Key Equations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.key_equations.map((eq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">{eq.name}</h3>
                    </div>
                    <div className="font-mono text-lg text-amber-300 bg-black/30 p-3 rounded-lg overflow-x-auto">
                      {eq.latex}
                    </div>
                    <p className="text-xs text-gray-400">{eq.description}</p>
                    {eq.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-white/5">
                        {eq.variables.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-xs text-amber-300 font-mono" title={v.description}>
                            {v.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommended Prototypes */}
          <motion.div variants={item}>
            <h2 className="text-lg font-medium text-white flex items-center gap-2 px-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              Recommended Prototypes
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {analysis.simulation_possibilities.map((sim, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="glass-panel p-6 rounded-2xl cursor-pointer group hover:border-purple-500/50 transition-all relative overflow-hidden"
                  onClick={() => onSimulate(sim, idx)}
                >
                  <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="w-24 h-24 text-purple-500 transform rotate-12 translate-x-4 -translate-y-4" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-blue-300 transition-all">
                        {sim.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "px-2 py-1 rounded-lg text-xs font-medium border",
                          sim.visualization_type === "3d" ? "border-purple-500/30 text-purple-400 bg-purple-500/10" :
                          sim.visualization_type === "animation" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
                          sim.visualization_type === "chart" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                          "border-gray-500/30 text-gray-400 bg-gray-500/10"
                        )}>
                          {sim.visualization_type}
                        </span>
                        <span className={clsx(
                          "px-2 py-1 rounded-lg text-xs font-bold border",
                          sim.complexity === "High" ? "border-red-500/30 text-red-400 bg-red-500/10" :
                          sim.complexity === "Medium" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" :
                          "border-blue-500/30 text-blue-400 bg-blue-500/10"
                        )}>
                          {sim.complexity}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-3 group-hover:text-gray-300 transition-colors">
                      {sim.description}
                    </p>

                    <p className="text-sm text-emerald-400/80 mb-4 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{sim.expected_insights}</span>
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
                         className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-colors group/btn border border-purple-500/20"
                       >
                         <Zap className="w-4 h-4" />
                         Build Prototype <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
