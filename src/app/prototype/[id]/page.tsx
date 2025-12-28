"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PrototypeRenderer from "@/components/PrototypeRenderer";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function PrototypePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const { id } = use(params);
  
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");

  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Determine the simulation plan from URL or local storage in a real app
    // Here we'll just mock generating it based on the title/description
    const generate = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            simulationTitle: title,
            simulationDescription: description
          }),
        });
        
        const data = await res.json();
        if (data.code) {
          setCode(data.code);
        } else {
          setError("Failed to generate code.");
        }
      } catch (err) {
        setError("Error connecting to generator.");
      } finally {
        setLoading(false);
      }
    };

    if (title) {
      generate();
    }
  }, [title, description]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
       {/* Header */}
       <header className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">{title || "Untitled Prototype"}</h1>
              <p className="text-xs text-gray-400">ID: {id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50">
               <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
               Regenerate
             </button>
          </div>
       </header>

       {/* Workspace */}
       <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

          {loading && (
            <div className="text-center space-y-4 z-10">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-blue-400 font-mono animate-pulse">Agent is coding your prototype...</p>
            </div>
          )}

          {error && (
            <div className="max-w-md w-full p-4 border border-red-500/30 bg-red-500/10 rounded-lg flex items-center gap-3 text-red-400 z-10">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && code && (
             <PrototypeRenderer code={code} />
          )}
       </div>
    </main>
  );
}
