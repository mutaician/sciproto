"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Sparkles, Cpu, Atom, Calculator, Dna, Zap } from "lucide-react";
import { ARXIV_CATEGORIES, CATEGORY_GROUPS, ArxivCategory } from "@/lib/arxiv";
import clsx from "clsx";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

// Icons for category groups
const GROUP_ICONS: Record<string, React.ReactNode> = {
  "AI & ML": <Sparkles className="w-4 h-4" />,
  "Computer Science": <Cpu className="w-4 h-4" />,
  "Physics": <Atom className="w-4 h-4" />,
  "Mathematics": <Calculator className="w-4 h-4" />,
  "Biology & Medicine": <Dna className="w-4 h-4" />,
  "Engineering": <Zap className="w-4 h-4" />,
};

// Colors for category groups
const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "AI & ML": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "Computer Science": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  "Physics": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Mathematics": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Biology & Medicine": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  "Engineering": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
};

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>("AI & ML");

  // Get display name for selected category
  const getDisplayName = () => {
    if (!selectedCategory) return "All Categories";
    return ARXIV_CATEGORIES[selectedCategory as ArxivCategory] || selectedCategory;
  };

  // Find which group a category belongs to
  const getCategoryGroup = (category: string): string | null => {
    for (const [group, categories] of Object.entries(CATEGORY_GROUPS)) {
      if ((categories as readonly string[]).includes(category)) return group;
    }
    return null;
  };

  const selectedGroup = selectedCategory ? getCategoryGroup(selectedCategory) : null;
  const selectedColors = selectedGroup ? GROUP_COLORS[selectedGroup] : null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={clsx(
          "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
          selectedCategory
            ? `${selectedColors?.bg} ${selectedColors?.border} ${selectedColors?.text}`
            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20"
        )}
      >
        {selectedGroup && GROUP_ICONS[selectedGroup]}
        <span className="font-medium">{getDisplayName()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 opacity-60" />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-2xl bg-gray-900/98 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
            >
              {/* All Categories Option */}
              <div className="p-2 border-b border-white/5">
                <button
                  onClick={() => {
                    onCategoryChange(null);
                    setIsOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors",
                    !selectedCategory
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-white/5 text-gray-300"
                  )}
                >
                  <span className="font-medium">All Categories</span>
                  {!selectedCategory && <Check className="w-4 h-4" />}
                </button>
              </div>

              {/* Category Groups */}
              <div className="p-2 space-y-1">
                {Object.entries(CATEGORY_GROUPS).map(([group, categories]) => {
                  const colors = GROUP_COLORS[group];
                  const isExpanded = expandedGroup === group;
                  const hasSelectedCategory = (categories as readonly string[]).includes(selectedCategory || "");

                  return (
                    <div key={group} className="rounded-xl overflow-hidden">
                      {/* Group Header */}
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : group)}
                        className={clsx(
                          "w-full flex items-center justify-between px-4 py-3 transition-colors",
                          hasSelectedCategory
                            ? `${colors.bg} ${colors.text}`
                            : "hover:bg-white/5 text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={hasSelectedCategory ? colors.text : "text-gray-500"}>
                            {GROUP_ICONS[group]}
                          </span>
                          <span className="font-medium">{group}</span>
                          <span className="text-xs text-gray-500">({categories.length})</span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 opacity-60" />
                        </motion.div>
                      </button>

                      {/* Category Items */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 pr-2 pb-2 space-y-1">
                              {categories.map((cat) => {
                                const isSelected = selectedCategory === cat;
                                const displayName = ARXIV_CATEGORIES[cat as ArxivCategory] || cat;

                                return (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      onCategoryChange(cat);
                                      setIsOpen(false);
                                    }}
                                    className={clsx(
                                      "w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors",
                                      isSelected
                                        ? `${colors.bg} ${colors.text}`
                                        : "hover:bg-white/5 text-gray-400"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-xs opacity-60">{cat}</span>
                                      <span>{displayName}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
