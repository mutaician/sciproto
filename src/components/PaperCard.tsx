"use client";

import { motion } from "framer-motion";
import { ArxivPaper, formatArxivDate, getRelativeTime } from "@/lib/arxiv";
import { 
  Users, Calendar, ExternalLink, Download, 
  Sparkles, Clock
} from "lucide-react";
import clsx from "clsx";

interface PaperCardProps {
  paper: ArxivPaper;
  onAnalyze: (paper: ArxivPaper) => void;
  breakthroughScore?: number; // Optional pre-computed score
  isAnalyzing?: boolean;
  disabled?: boolean; // Disable analyze button (e.g., when another paper is being analyzed)
  variant?: "default" | "compact" | "featured";
}

// Get color based on category
function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  if (category.startsWith("cs.AI") || category.startsWith("cs.LG") || category.startsWith("stat.ML")) {
    return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" };
  }
  if (category.startsWith("cs.")) {
    return { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" };
  }
  if (category.startsWith("physics") || category.startsWith("quant") || category.startsWith("cond") || category.startsWith("hep")) {
    return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
  }
  if (category.startsWith("math")) {
    return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" };
  }
  if (category.startsWith("q-bio")) {
    return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" };
  }
  return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" };
}

export default function PaperCard({ 
  paper, 
  onAnalyze, 
  breakthroughScore,
  isAnalyzing = false,
  disabled = false,
  variant = "default" 
}: PaperCardProps) {
  const categoryColor = getCategoryColor(paper.primaryCategory);
  const relativeTime = getRelativeTime(paper.published);
  const isRecent = relativeTime === "Today" || relativeTime === "Yesterday";

  if (variant === "compact") {
    return (
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        className="group relative p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all cursor-pointer"
        onClick={() => onAnalyze(paper)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">
              {paper.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
              {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
            </p>
          </div>
          <div className={clsx("flex-shrink-0 px-2 py-1 rounded-lg text-xs font-mono", categoryColor.bg, categoryColor.text)}>
            {paper.primaryCategory}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "featured") {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Featured Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
          <Sparkles className="w-3 h-3" />
          Featured
        </div>

        <div className="relative z-10 space-y-4">
          {/* Category & Date */}
          <div className="flex items-center gap-3 text-sm">
            <span className={clsx("px-2 py-1 rounded-lg font-mono text-xs", categoryColor.bg, categoryColor.text)}>
              {paper.primaryCategory}
            </span>
            <span className="text-gray-500">{formatArxivDate(paper.published)}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors leading-tight">
            {paper.title}
          </h3>

          {/* Authors */}
          <p className="text-sm text-gray-400">
            {paper.authors.slice(0, 5).join(", ")}{paper.authors.length > 5 ? " et al." : ""}
          </p>

          {/* Abstract */}
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
            {paper.summary}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAnalyze(paper)}
              disabled={isAnalyzing || disabled}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 font-medium text-sm border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Paper
                </>
              )}
            </motion.button>
            
            <a
              href={paper.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative flex flex-col p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/8 transition-all overflow-hidden"
    >
      {/* Recent Badge */}
      {isRecent && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Clock className="w-3 h-3" />
          {relativeTime}
        </div>
      )}

      {/* Breakthrough Score (if available) */}
      {breakthroughScore !== undefined && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-bold">
          {breakthroughScore}
        </div>
      )}

      <div className="space-y-3 flex-1">
        {/* Category & ID */}
        <div className="flex items-center gap-2 text-xs">
          <span className={clsx("px-2 py-0.5 rounded-md font-mono", categoryColor.bg, categoryColor.text)}>
            {paper.primaryCategory}
          </span>
          <span className="text-gray-600 font-mono">{paper.id}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
          {paper.title}
        </h3>

        {/* Authors */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ""}
          </span>
        </div>

        {/* Abstract Preview */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
          {paper.summary}
        </p>

        {/* Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatArxivDate(paper.published)}</span>
          {!isRecent && <span className="text-gray-600">({relativeTime})</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAnalyze(paper)}
          disabled={isAnalyzing || disabled}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 font-medium text-sm hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAnalyzing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze
            </>
          )}
        </motion.button>

        <div className="flex items-center gap-1">
          <a
            href={paper.arxivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="View on arXiv"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 text-gray-500 hover:text-gray-300" />
          </a>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Download PDF"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4 text-gray-500 hover:text-gray-300" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
