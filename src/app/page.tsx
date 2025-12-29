"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import AnalysisPanel from "@/components/AnalysisPanel";
import AnalyzingOverlay from "@/components/AnalyzingOverlay";
import { PaperAnalysis } from "@/lib/gemini";
import { Atom, ArrowRight } from "lucide-react";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [papers, setPapers] = useState<any[]>([]);

  useEffect(() => {
    fetchPapers();
  }, [analysis]); // Re-fetch when returning to home

  const fetchPapers = async () => {
      try {
          const res = await fetch("/api/papers");
          const data = await res.json();
          if (data.papers) setPapers(data.papers);
      } catch (e) {
          console.error("Failed to fetch papers");
      }
  };

  const loadPaper = (paper: any) => {
      setAnalysis(JSON.parse(paper.analysis_json));
      setCurrentText(paper.raw_text);
      setCurrentHash(paper.hash);
  };

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setCurrentText("");
    setCurrentHash("");

    try {
      // 1. Upload & Extract Text
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { text, hash, cachedAnalysis } = await uploadRes.json();

      if (!text) throw new Error("Failed to extract text");
      
      setCurrentText(text);
      setCurrentHash(hash);

      if (cachedAnalysis) {
        console.log("Using Cached Analysis for:", hash);
        setAnalysis(cachedAnalysis);
        setIsAnalyzing(false);
        return; // Skip new analysis
      }

      // 2. Analyze with Gemini (and save to cache using hash)
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, hash, filename: file.name }),
      });
      
      const analysisData = await analyzeRes.json();
      setAnalysis(analysisData);

    } catch (error) {
      console.error("Pipeline failed:", error);
      alert("Something went wrong processing the paper.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyze = async () => {
    if (!currentText) return;
    
    // Force re-analysis by calling analyze API directly
    if (!confirm("Are you sure you want to re-analyze? This will consume more credits.")) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const analyzeRes = await fetch("/api/analyze", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ text: currentText, hash: currentHash, filename: "reanalysis.pdf" }),
       });
       
       const analysisData = await analyzeRes.json();
       setAnalysis(analysisData);
    } catch(error) {
       console.error("Re-analysis failed:", error);
       alert("Failed to re-analyze.");
    } finally {
       setIsAnalyzing(false);
    }
  };

  // Add router
  const router = useRouter();

  const handleSimulate = (sim: any) => {
    // Generate a slug or ID for the prototype
    const timestamp = Date.now();
    const slug = sim.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = `${slug}-${timestamp}`;
    
    // Encode parameters
    const params = new URLSearchParams({
      title: sim.title,
      description: sim.description
    });
    
    router.push(`/prototype/${id}?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8 md:p-24 relative overflow-hidden">
      
      {/* Background Decor - Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <div className="z-10 text-center mb-12 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 animate-pulse-slow">
            <Atom className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold tracking-tighter text-white">
            Sci<span className="text-gradient">Proto</span>
          </h1>
        </div>
        <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
          Transform static research papers into interactive prototypes.
          <br />
          Powered by <span className="text-white font-medium">Gemini 3</span>.
        </p>
      </div>

      <div className="w-full z-10 flex flex-col items-center gap-12 transition-all max-w-6xl">
        {!analysis && (
            <>
               <div className="relative w-full max-w-2xl">
                  <UploadZone onUpload={handleUpload} isAnalyzing={isAnalyzing} />
                  <AnalyzingOverlay isAnalyzing={isAnalyzing} />
               </div>
               
               {/* Dashboard List */}
               {papers.length > 0 && (
                   <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-semibold text-white">Your Research Library</h2>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono">{papers.length} Papers</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {papers.map((paper: any) => (
                                <button 
                                    key={paper.hash}
                                    onClick={() => loadPaper(paper)}
                                    className="group relative flex flex-col items-start gap-2 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all text-left"
                                >
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-blue-400 -rotate-45 group-hover:rotate-0 transition-transform" />
                                    </div>
                                    
                                    <h3 className="font-semibold text-lg text-gray-200 group-hover:text-white line-clamp-1 pr-8">
                                        {JSON.parse(paper.analysis_json).title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">
                                        {JSON.parse(paper.analysis_json).summary}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 font-mono">
                                        <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{paper.filename}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                   </div>
               )}
            </>
        )}

        {analysis && (
          <AnalysisPanel 
             analysis={analysis} 
             onSimulate={handleSimulate} 
             onReanalyze={handleReanalyze}
             onBack={() => setAnalysis(null)} 
          />
        )}
      </div>

    </main>
  );
}
