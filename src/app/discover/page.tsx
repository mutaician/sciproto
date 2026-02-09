"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Atom, Compass, TrendingUp, Calendar, Sparkles, 
  RefreshCw, ChevronLeft, Loader2, AlertCircle, ArrowRight
} from "lucide-react";
import Link from "next/link";

import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import PaperCard from "@/components/PaperCard";
import { ArxivPaper, ArxivSearchResult } from "@/lib/arxiv";

// Quick filter options
type QuickFilter = "latest" | "trending" | "ai" | "physics" | "math";

const QUICK_FILTERS: { id: QuickFilter; label: string; icon: React.ReactNode; category?: string }[] = [
  { id: "latest", label: "Latest", icon: <Calendar className="w-4 h-4" /> },
  { id: "trending", label: "AI & ML", icon: <TrendingUp className="w-4 h-4" />, category: "cs.AI" },
  { id: "ai", label: "Machine Learning", icon: <Sparkles className="w-4 h-4" />, category: "cs.LG" },
  { id: "physics", label: "Quantum", icon: <Atom className="w-4 h-4" />, category: "quant-ph" },
  { id: "math", label: "Optimization", icon: <Compass className="w-4 h-4" />, category: "math.OC" },
];

export default function DiscoverPage() {
  const router = useRouter();
  
  // State
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>("cs.AI");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("trending");
  const [totalResults, setTotalResults] = useState(0);
  const [analyzingPaperId, setAnalyzingPaperId] = useState<string | null>(null);

  // Fetch papers
  const fetchPapers = useCallback(async (query?: string, category?: string | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      params.set("max", "20");
      params.set("sort", "submittedDate");
      params.set("order", "descending");

      const response = await fetch(`/api/arxiv?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch papers");
      }

      const data: ArxivSearchResult = await response.json();
      setPapers(data.papers);
      setTotalResults(data.totalResults);
    } catch (err) {
      console.error("Error fetching papers:", err);
      setError("Failed to load papers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPapers(undefined, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setQuickFilter("latest");
    if (query) {
      setSelectedCategory(null);
      fetchPapers(query, null);
    } else {
      fetchPapers(undefined, selectedCategory);
    }
  }, [fetchPapers, selectedCategory]);

  // Handle category change
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setQuickFilter("latest");
    fetchPapers(undefined, category);
  }, [fetchPapers]);

  // Handle quick filter
  const handleQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilter(filter);
    setSearchQuery("");
    const filterConfig = QUICK_FILTERS.find(f => f.id === filter);
    if (filterConfig?.category) {
      setSelectedCategory(filterConfig.category);
      fetchPapers(undefined, filterConfig.category);
    } else {
      fetchPapers(undefined, selectedCategory);
    }
  }, [fetchPapers, selectedCategory]);

  // Handle analyze paper
  const handleAnalyzePaper = useCallback(async (paper: ArxivPaper) => {
    // Prevent multiple simultaneous analyses
    if (analyzingPaperId) {
      alert("Please wait for the current analysis to complete.");
      return;
    }
    
    setAnalyzingPaperId(paper.id);

    try {
      // Fetch paper with text extraction
      const response = await fetch(`/api/arxiv/${encodeURIComponent(paper.id)}?text=true`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch paper");
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error("Failed to extract text from PDF");
      }

      // Create a hash from the arXiv ID
      const hash = `arxiv-${paper.id}`;

      // Analyze the paper
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.text,
          hash,
          filename: `${paper.id}.pdf`,
        }),
      });

      if (!analyzeResponse.ok) {
        throw new Error("Failed to analyze paper");
      }

      // Navigate to the paper page to see analysis and choose simulation
      router.push(`/papers/${hash}`);
      
    } catch (err) {
      console.error("Error analyzing paper:", err);
      alert("Failed to analyze paper. Please try again.");
    } finally {
      setAnalyzingPaperId(null);
    }
  }, [router, analyzingPaperId]);

  // Refresh
  const handleRefresh = useCallback(() => {
    fetchPapers(searchQuery || undefined, selectedCategory);
  }, [fetchPapers, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="h-6 w-px bg-white/10" />
              
              <Link href="/" className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Atom className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xl font-bold text-white">
                  Sci<span className="text-gradient">Proto</span>
                </span>
              </Link>
            </div>

            {/* Page Title */}
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" />
              <h1 className="text-lg font-semibold text-white">Discover</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search & Filters */}
        <div className="space-y-6 mb-8">
          {/* Search Bar */}
          <div className="flex justify-center">
            <SearchBar 
              onSearch={handleSearch}
              isLoading={isLoading}
              initialValue={searchQuery}
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2">
              {QUICK_FILTERS.map((filter) => (
                <motion.button
                  key={filter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    quickFilter === filter.id
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {filter.icon}
                  {filter.label}
                </motion.button>
              ))}
            </div>

            {/* Category Filter & Refresh */}
            <div className="flex items-center gap-3">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${isLoading ? "animate-spin" : ""}`} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">
              {searchQuery ? `Results for "${searchQuery}"` : "Latest Papers"}
            </h2>
            {!isLoading && (
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-400 text-sm">
                {totalResults.toLocaleString()} papers
              </span>
            )}
          </div>
          
          {selectedCategory && (
            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-mono">
              {selectedCategory}
            </span>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-12 h-12 text-blue-400" />
              </motion.div>
              <p className="mt-4 text-gray-400">Searching arXiv...</p>
            </motion.div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="p-4 rounded-full bg-red-500/10 mb-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-red-400 text-lg font-medium">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Empty State */}
          {!isLoading && !error && papers.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="p-4 rounded-full bg-gray-500/10 mb-4">
                <Compass className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg">No papers found</p>
              <p className="text-gray-500 text-sm mt-2">Try a different search or category</p>
            </motion.div>
          )}

          {/* Papers Grid */}
          {!isLoading && !error && papers.length > 0 && (
            <motion.div
              key="papers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {papers.map((paper, index) => (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PaperCard
                    paper={paper}
                    onAnalyze={handleAnalyzePaper}
                    isAnalyzing={analyzingPaperId === paper.id}
                    disabled={analyzingPaperId !== null && analyzingPaperId !== paper.id}
                    variant={index === 0 ? "featured" : "default"}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More (placeholder for pagination) */}
        {!isLoading && papers.length > 0 && papers.length < totalResults && (
          <div className="flex justify-center mt-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
            >
              Load More Papers
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>Data from <a href="https://arxiv.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">arXiv.org</a></p>
            <p>Powered by <span className="text-white">Gemini 3</span></p>
          </div>
        </div>
      </footer>
    </main>
  );
}
