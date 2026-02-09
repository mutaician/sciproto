"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import AnalyzingOverlay from "@/components/AnalyzingOverlay";
import { Atom, ArrowRight, ArrowLeft, FileText, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface Paper {
  hash: string;
  filename: string;
  raw_text?: string;
  analysis_json: string;
  created_at: number;
}

interface PaperAnalysis {
  title: string;
  summary: string;
}

export default function PapersPage() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const res = await fetch("/api/papers");
      const data = await res.json();
      if (data.papers) setPapers(data.papers);
    } catch (e) {
      console.error("Failed to fetch papers", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true);

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

      // If cached, redirect immediately
      if (cachedAnalysis) {
        console.log("Using Cached Analysis for:", hash);
        router.push(`/papers/${hash}`);
        return;
      }

      // 2. Analyze with Gemini
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, hash, filename: file.name }),
      });
      
      if (!analyzeRes.ok) {
        throw new Error("Analysis failed");
      }

      // Redirect to the paper page
      router.push(`/papers/${hash}`);

    } catch (error) {
      console.error("Pipeline failed:", error);
      alert("Something went wrong processing the paper.");
      setIsAnalyzing(false);
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
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
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
              <h1 className="text-lg font-semibold text-white">Your Papers</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full z-10">
        <div className="space-y-8">
          {/* Upload Zone */}
          <div className="relative max-w-2xl mx-auto">
            <UploadZone onUpload={handleUpload} isAnalyzing={isAnalyzing} />
            <AnalyzingOverlay isAnalyzing={isAnalyzing} />
          </div>
          
          {/* Paper Library */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
              <p className="text-gray-400">Loading papers...</p>
            </div>
          ) : papers.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-semibold text-white">Research Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono">
                  {papers.length} Papers
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {papers.map((paper) => {
                  let paperAnalysis: PaperAnalysis | null = null;
                  try {
                    paperAnalysis = JSON.parse(paper.analysis_json);
                  } catch {
                    return null;
                  }
                  
                  return (
                    <Link
                      key={paper.hash}
                      href={`/papers/${paper.hash}`}
                      className="group relative flex flex-col items-start gap-2 p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all"
                    >
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-blue-400 -rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                      
                      <h3 className="font-semibold text-lg text-gray-200 group-hover:text-white line-clamp-1 pr-8">
                        {paperAnalysis?.title || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {paperAnalysis?.summary || "No summary available"}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono">{paper.filename}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No papers yet. Upload a PDF to get started!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
