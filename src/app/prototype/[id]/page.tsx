"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PrototypeRenderer from "@/components/PrototypeRenderer";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function PrototypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");

  // Chat State
  const [history, setHistory] = useState<any[]>([]);
  
  const [status, setStatus] = useState<"idle" | "thinking" | "executing" | "waiting_for_user">("idle");
  const [currentCode, setCurrentCode] = useState<string>("");
  const [agentMessage, setAgentMessage] = useState<string>("");
  
  // Prevent double-init in Strict Mode
  const hasStarted = useRef(false);

  // Initial Kickoff
  useEffect(() => {
    if (title && history.length === 0 && !hasStarted.current) {
      hasStarted.current = true;
      startAgentLoop(`I need a React simulation for: ${title}. ${description}.`);
    }
  }, [title, description]);

  const startAgentLoop = async (userMessage?: string, functionResponse?: any) => {
    setStatus("thinking");
    setAgentMessage(""); 
    
    // Optimistic Update
    const newItems: any[] = [];
    if (userMessage) {
      newItems.push({ role: "user", parts: [{ text: userMessage }] });
    }
    if (functionResponse) {
       newItems.push({ 
            role: "tool", 
            parts: [{ functionResponse: { name: functionResponse.name, response: functionResponse.response } }] 
       });
    }
    
    // We append to history immediately
    let currentHistory = [...history, ...newItems];
    if (newItems.length > 0) {
        setHistory(currentHistory);
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the history we just constructed locally
        body: JSON.stringify({ 
          history: currentHistory, 
          message: userMessage, 
          functionResponse 
        }),
      });
      
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      // Stream Loop
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        
        const lines = chunkValue.split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
           try {
             const json = JSON.parse(line);
             
             if (json.type === "text") {
                const text = json.content;
                accumulatedText += text;
                setAgentMessage(accumulatedText);
            } else if (json.type === "tool_call_part") {
                setStatus("executing");
                const part = json.part;
                const toolCall = part.functionCall;
                
                // Add Assistant turn to history
                // We split text and functionCall parts as per Gemini API requirements structure if needed, 
                // but usually the API sends them separate or we can construct one turn.
                // For simplicity here, we append the turn.
                setHistory(prev => [...prev, { 
                    role: "model", 
                    parts: accumulatedText ? [{ text: accumulatedText }, part] : [part]
                }]);

                if (toolCall.name === "render_prototype") {
                     const args = toolCall.args;
                     let code = "";
                     if (typeof args === 'string') {
                          try { code = JSON.parse(args).code; } catch (e) { console.error(e); }
                     } else {
                          code = args?.code;
                     }

                     if (code) {
                         // Basic cleanup only
                         code = code.replace(/^```[\w\s]*\n/, "").replace(/```$/, "");
                         setCurrentCode(code);
                     }
                }
            }
           } catch (e) {
             console.error("JSON Parse Error", e);
           }
        }
      }
      
      // End of stream - Text only case
      if (status !== "executing") {
         setStatus("idle");
         if (accumulatedText) {
             setHistory(prev => [...prev, { role: "model", parts: [{ text: accumulatedText }] }]);
         }
      }

    } catch (e) {
      console.error(e);
      setAgentMessage("Agent connection failed.");
      setStatus("idle");
    }
  };

  const handleRenderStatus = (status: 'success' | 'error', payload: any) => {
    setTimeout(() => {
        if (status === 'success') {
             startAgentLoop(undefined, { name: 'render_prototype', response: { success: true, message: "Rendered successfully." } });
        } else {
            setAgentMessage("Runtime Error. Retrying...");
            startAgentLoop(undefined, { name: 'render_prototype', response: { success: false, error: payload } });
        }
    }, 1000);
  };

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
              <p className="text-xs text-gray-400">Status: {status.toUpperCase()}</p>
            </div>
          </div>
       </header>

       {/* Workspace */}
       <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

            {/* Simple Status Message */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className={clsx(
                      "px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-3 transition-all pointer-events-auto shadow-2xl",
                      "bg-black/80 border-white/20"
                  )}>
                     {status === "thinking" && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                     <span className="text-sm font-mono text-gray-200">
                         {status === "thinking" ? "Generating..." : 
                          status === "executing" ? "Rendering..." : 
                          "Ready"}
                     </span>
                  </div>
             </div>

           {/* Rendered Prototype Only */}
           {currentCode ? (
              <div className="flex-1 w-full h-full relative">
                  <PrototypeRenderer code={currentCode} onRenderStatus={(s, p) => {
                      if (status === 'executing') {
                          handleRenderStatus(s, p);
                      }
                  }} />
              </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono p-10 overflow-hidden">
                {!agentMessage && "Waiting for Agent to generate prototype..."}
                {status === "thinking" && (
                    <div className="flex flex-col items-center gap-4 animate-pulse">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Generating Code...</p>
                    </div>
                )}
                {/* Just show simple message if not coding */}
                {status === "idle" && agentMessage && (
                    <div className="max-w-md text-center p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-gray-300">{agentMessage}</p>
                    </div>
                )}
             </div>
           )}
       </div>
    </main>
  );
}
