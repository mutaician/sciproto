"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Atom, ArrowLeft, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import AnalysisPanel from "@/components/AnalysisPanel";
import { PaperAnalysis } from "@/lib/gemini";

interface Paper {
  hash: string;
  filename: string;
  raw_text: string;
  analysis_json: string;
  created_at: number;
}

export default function PaperPage({ params }: { params: Promise<{ hash: string }> }) {
  const resolvedParams = use(params);
  const paperHash = resolvedParams.hash;
  const router = useRouter();
  
  const [paper, setPaper] = useState<Paper | null>(null);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load paper on mount
  useEffect(() => {
    async function loadPaper() {
      try {
        const res = await fetch("/api/papers");
        const data = await res.json();
        
        if (data.papers) {
          const found = data.papers.find((p: Paper) => p.hash === paperHash);
          if (found) {
            setPaper(found);
            setAnalysis(JSON.parse(found.analysis_json));
          } else {
            setError("Paper not found");
          }
        }
      } catch (e) {
        console.error("Failed to load paper:", e);
        setError("Failed to load paper");
      } finally {
        setIsLoading(false);
      }
    }
    loadPaper();
  }, [paperHash]);

  const handleSimulate = (sim: { title: string; description: string }) => {
    const timestamp = Date.now();
    const slug = sim.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `${slug}-${timestamp}`;
    
    const params = new URLSearchParams({
      title: sim.title,
      description: sim.description,
      hash: paperHash
    });
    
    router.push(`/prototype/${id}?${params.toString()}`);
  };

  const handleReanalyze = async () => {
    if (!paper?.raw_text) return;
    
    if (!confirm("Are you sure you want to re-analyze? This will consume more credits.")) return;

    setIsLoading(true);

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: paper.raw_text, 
          hash: paperHash, 
          filename: paper.filename 
        }),
      });
       
      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData);
    } catch (e) {
      console.error("Re-analysis failed:", e);
      alert("Failed to re-analyze.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/50 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/papers"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Papers</span>
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

            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-semibold text-white truncate max-w-xs">
                {analysis?.title || "Loading..."}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading paper...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-400 text-lg">{error}</p>
            <Link 
              href="/papers"
              className="mt-4 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
            >
              Back to Papers
            </Link>
          </div>
        )}

        {!isLoading && !error && analysis && (
          <AnalysisPanel 
            analysis={analysis} 
            onSimulate={handleSimulate} 
            onReanalyze={handleReanalyze}
            onBack={() => router.push("/papers")} 
          />
        )}
      </div>
    </main>
  );
}
