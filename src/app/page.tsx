"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import AnalysisPanel from "@/components/AnalysisPanel";
import { PaperAnalysis } from "@/lib/gemini";
import { Atom } from "lucide-react";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      // 1. Upload & Extract Text
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const { text } = await uploadRes.json();

      if (!text) throw new Error("Failed to extract text");

      // 2. Analyze with Gemini
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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

  const handleSimulate = (sim: any) => {
    console.log("Simulating:", sim);
    // TODO: Navigate to prototype page
    alert(`Starting build for: ${sim.title}`);
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

      {/* Main Interaction Area */}
      <div className="w-full z-10 flex flex-col items-center gap-8 transition-all">
        {!analysis && (
           <UploadZone onUpload={handleUpload} isAnalyzing={isAnalyzing} />
        )}

        {analysis && (
          <AnalysisPanel analysis={analysis} onSimulate={handleSimulate} />
        )}
      </div>

    </main>
  );
}
