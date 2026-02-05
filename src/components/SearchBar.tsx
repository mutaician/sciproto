"use client";

import { useState, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  initialValue?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search papers by title, author, or keywords...",
  isLoading = false,
  initialValue = ""
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setQuery("");
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <motion.div
        animate={{
          boxShadow: isFocused 
            ? "0 0 0 2px rgba(59, 130, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.3)"
            : "0 0 0 1px rgba(255, 255, 255, 0.1), 0 2px 10px rgba(0, 0, 0, 0.2)"
        }}
        transition={{ duration: 0.2 }}
        className="relative flex items-center rounded-2xl bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        {/* Search Icon */}
        <div className="absolute left-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: "linear" } }}
              >
                <Loader2 className="w-5 h-5 text-blue-400" />
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-blue-400" : "text-gray-500"}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full py-4 pl-12 pr-24 bg-transparent text-white placeholder-gray-500 focus:outline-none text-base"
        />

        {/* Clear & Submit Buttons */}
        <div className="absolute right-2 flex items-center gap-2">
          <AnimatePresence>
            {query && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <motion.button
            type="submit"
            disabled={!query.trim() || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 font-medium text-sm border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </motion.button>
        </div>
      </motion.div>

      {/* Search Tips */}
      <AnimatePresence>
        {isFocused && !query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl bg-gray-900/95 backdrop-blur-sm border border-white/10 z-50"
          >
            <p className="text-xs text-gray-400 mb-2">Search tips:</p>
            <div className="flex flex-wrap gap-2">
              {["transformer", "diffusion model", "reinforcement learning", "neural network", "attention mechanism"].map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => {
                    setQuery(tip);
                    onSearch(tip);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  {tip}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
