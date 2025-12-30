"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PrototypeRenderer from "@/components/PrototypeRenderer";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ChatInterface from "@/components/ChatInterface";

export default function PrototypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const hash = searchParams.get("hash");

  // App State
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<"idle" | "thinking" | "executing" | "waiting_for_user">("idle");
  const [currentCode, setCurrentCode] = useState<string>("");
  const [agentMessage, setAgentMessage] = useState<string>("");
  const [paperContext, setPaperContext] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Prevent double-init
  const hasStarted = useRef(false);

  // 1. Fetch Paper Context on Mount
  useEffect(() => {
     async function fetchContext() {
         if (!hash) return;
         try {
             // We can use the existing papers API to find by hash
             // But wait, the papers API lists *all*, let's assume we can filter or just use the upload response cache if we had it.
             // Actually, simplest is to hit the upload endpoint check or we specifically made a get endpoint?
             // Let's rely on the previous /api/papers endpoint which returns all, and filter.
             // OR better: The /api/papers endpoint returns everything. If list is small it's fine.
             const res = await fetch("/api/papers");
             const data = await res.json();
             const paper = data.papers?.find((p: any) => p.hash === hash);
             if (paper) {
                 console.log("Context Loaded:", paper.raw_text.length, "chars");
                 setPaperContext(paper.raw_text);
             }
         } catch (e) {
             console.error("Failed to load paper context", e);
         }
     }
     fetchContext();
  }, [hash]);

  // 2. Start Agent Loop (Once Context is Ready OR Timeout)
  useEffect(() => {
    const controller = new AbortController();
    
    // We wait a beat for paperContext to load, but we shouldn't block forever.
    // Actually, let's just trigger it. If paperContext updates later, we can't easily inject it into *past* history without a restart.
    // So we should probably wait for paperContext if 'hash' is present.
    
    if (title && history.length === 0 && !hasStarted.current) {
       // If we have a hash but no context yet, maybe wait? 
       // For now, let's just go. If context arrives later, we can inject it as a system note? 
       // BETTER: Let's assume the user uploaded it recently, or we just trust the description first.
       
       // actually, let's wrap this in a separate effect that depends on paperContext?
       // No, keep it simple. If paperContext is missing initially, the agent just knows the title.
       // BUT the user wants the agent to know it. 
       
       // Let's do this: check if we successfully loaded context or gave up.
       // For this MVP step, I will just fire it. The 'fetchContext' above is async.
       // Let's add a check: if hash exists and !paperContext, don't start yet?
       // That might hang if fetch fails.
       
       // Strategy: Start immediately. We will inject context in the *Prompt* string constructed inside startAgentLoop call
       // But useEffect runs once.
    }
  }, []); // We actually need to control this carefully.

  // Let's use a specialized effect that watches for Readiness
  useEffect(() => {
      const controller = new AbortController();

      const readyToStart = title && history.length === 0 && !hasStarted.current;
      const contextReady = !hash || (hash && paperContext); // If no hash needed, or hash requested & context loaded

      if (readyToStart && contextReady) {
          hasStarted.current = true;
          
          let initialPrompt = `Task: Create a prototype for "${title}".\nContext: ${description}`;
          if (paperContext) {
              initialPrompt += `\n\nFULL PAPER CONTENT:\n${paperContext}`;
          }
          
          startAgentLoop(initialPrompt, undefined, controller.signal);
      }
      
      return () => controller.abort();
  }, [title, description, hash, paperContext]);


  const startAgentLoop = async (userMessage?: string, functionResponse?: any, signal?: AbortSignal) => {
    if (signal?.aborted) return;

    setStatus("thinking");
    setAgentMessage(""); 
    
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
    
    let currentHistory = [...history, ...newItems];
    if (newItems.length > 0) {
        setHistory(currentHistory);
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: signal,
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
        if (signal?.aborted) {
            reader.cancel();
            break;
        }
        
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
                
                // Live update the last message in history for streaming effect in ChatInterface
                // We don't commit it to history state yet, but we could if we wanted smooth streaming there.
                // For simplicity, we update history at the end or use a temporary "streaming" state in ChatInterface?
                // Actually ChatInterface just renders 'history'.
                // Let's append a temporary partial message?
                // Safe way: update history continuously.
                
                // setHistory(prev => {
                //    const last = prev[prev.length - 1];
                //    if (last && last.role === 'model' && !last.parts[0].functionCall) {
                //        // Append to existing text part
                //        // This is tricky with React state batching.
                //        // Let's just wait for end of stream for text updates to avoid flickering?
                //        // User said "Standard Text Streaming is safe". 
                //    }
                //    return prev;
                // });
                
                // SIMPLEST: Only update the "agentMessage" state (which we used for the status pill).
                // And let the ChatInterface show `status === "thinking"` thinking dots.
                // Once done, the full text pushes to history.
                
            } else if (json.type === "tool_call_part") {
                setStatus("executing");
                const part = json.part;
                const toolCall = part.functionCall;
                
                // Commit the accumulated text + tool call to history
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
      if (status !== "executing" && !signal?.aborted) {
         setStatus("idle");
         if (accumulatedText) {
             setHistory(prev => [...prev, { role: "model", parts: [{ text: accumulatedText }] }]);
         }
      }

    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error(e);
      setAgentMessage("Agent connection failed.");
      setStatus("idle");
    }
  };

  const handleRenderStatus = (status: 'success' | 'error', payload: any) => {
    setTimeout(() => {
        if (status === 'success') {
             setStatus("idle");
             setAgentMessage("Prototype Ready");
             setHistory(prev => [...prev, { 
                  role: "tool", 
                  parts: [{ functionResponse: { name: 'render_prototype', response: { success: true, message: "Rendered successfully. Ready for user feedback." } } }] 
             }]);
        } else {
            setAgentMessage("Auto-fixing Error...");
            startAgentLoop(undefined, { name: 'render_prototype', response: { success: false, error: payload } });
        }
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
       {/* Header */}
       <header className="h-14 border-b border-white/10 flex items-center px-4 justify-between bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
                 <h1 className="font-bold text-sm md:text-base hidden md:block">{title || "Untitled Prototype"}</h1>
                 <div className={clsx("w-2 h-2 rounded-full", status === "idle" ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
            </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 hover:bg-white/10 rounded-lg text-xs font-mono text-gray-400 border border-white/10"
          >
             {isSidebarOpen ? "Hide Chat" : "Show Chat"}
          </button>
       </header>

       {/* Workspace */}
       <div className="flex-1 flex overflow-hidden">
           {/* Left: Chat Interface */}
           <div className={clsx(
               "transition-all duration-300 ease-in-out border-r border-white/10 flex flex-col",
               isSidebarOpen ? "w-[30%] min-w-[320px] translate-x-0" : "w-0 min-w-0 -translate-x-full opacity-0"
           )}>
               <ChatInterface 
                    history={history} 
                    onSendMessage={(msg) => startAgentLoop(msg)} 
                    status={status}
                    className="h-full" 
               />
           </div>

           {/* Right: Prototype */}
           <div className="flex-1 relative bg-gray-900/50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

              {/* Central Status Pill (Only nice to have if loading init) */}
              {!currentCode && (
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                      {status === "thinking" && <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />}
                      <p className="text-gray-500 font-mono text-sm animate-pulse">
                          {status === 'thinking' ? "Analyzing Paper & Designing..." : "Waiting for Agent..."}
                      </p>
                 </div>
              )}

              {/* Rendered Prototype */}
              <div className="w-full h-full">
                  {currentCode && (
                      <PrototypeRenderer code={currentCode} onRenderStatus={(s, p) => {
                          if (status === 'executing') {
                              handleRenderStatus(s, p);
                          }
                      }} />
                  )}
              </div>
           </div>
       </div>
    </main>
  );
}
