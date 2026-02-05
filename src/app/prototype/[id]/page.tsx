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
  const [prototypeTitle, setPrototypeTitle] = useState<string>("");
  const [algorithmInfo, setAlgorithmInfo] = useState<string>("");

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
                
            } else if (json.type === "tool_call_part" || json.type === "tool_call") {
                setStatus("executing");
                
                // Handle both old format (tool_call_part with part.functionCall) and new format (tool_call with name/args)
                let toolName: string;
                let toolArgs: any;
                
                if (json.type === "tool_call") {
                  // New format from updated agent
                  toolName = json.name;
                  toolArgs = json.args;
                } else {
                  // Legacy format
                  const part = json.part;
                  toolName = part.functionCall?.name;
                  toolArgs = part.functionCall?.args;
                }
                
                // Commit the accumulated text + tool call to history
                const toolCallPart = { functionCall: { name: toolName, args: toolArgs } };
                setHistory(prev => [...prev, { 
                    role: "model", 
                    parts: accumulatedText ? [{ text: accumulatedText }, toolCallPart] : [toolCallPart]
                }]);
                accumulatedText = ""; // Clear to prevent duplicate

                if (toolName === "render_prototype") {
                     let code = "";
                     let protoTitle = "";
                     let algoInfo = "";
                     
                     if (typeof toolArgs === 'string') {
                          try { 
                            const parsed = JSON.parse(toolArgs);
                            code = parsed.code;
                            protoTitle = parsed.title || "";
                            algoInfo = parsed.algorithm_implemented || "";
                          } catch (e) { console.error(e); }
                     } else {
                          code = toolArgs?.code;
                          protoTitle = toolArgs?.title || json.title || "";
                          algoInfo = toolArgs?.algorithm_implemented || json.algorithm || "";
                     }

                     if (code) {
                         code = code.replace(/^```[\w\s]*\n/, "").replace(/```$/, "");
                         setCurrentCode(code);
                         // Reset fixing flag - new code is being rendered
                         isFixingRef.current = false;
                     }
                     
                     if (protoTitle) setPrototypeTitle(protoTitle);
                     if (algoInfo) setAlgorithmInfo(algoInfo);
                }
            } else if (json.type === "done") {
                // Stream completed
                isFixingRef.current = false; // Reset on completion
                if (status !== "executing" && !signal?.aborted) {
                   setStatus("idle");
                   if (accumulatedText) {
                       setHistory(prev => [...prev, { role: "model", parts: [{ text: accumulatedText }] }]);
                       accumulatedText = ""; // Clear to prevent duplicate in end-of-stream handler
                   }
                }
            } else if (json.type === "error") {
                console.error("Agent error:", json.message);
                const errorMsg = json.message || "Unknown error";
                setAgentMessage("Error: " + errorMsg);
                isFixingRef.current = false; // Reset on error
                setStatus("idle");
                accumulatedText = ""; // Clear to prevent duplicate
                
                // Add error to history so user can see it
                setHistory(prev => [...prev, { 
                  role: "model", 
                  parts: [{ text: `⚠️ ${errorMsg}${json.retryable ? '\n\nYou can try again by sending another message.' : ''}` }] 
                }]);
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

  // Track if we're currently fixing an error to prevent loops
  const isFixingRef = useRef(false);
  
  const handleRenderStatus = (renderStatus: 'success' | 'error', payload: any) => {
    // Prevent calling this while already processing
    if (isFixingRef.current && renderStatus === 'error') {
      console.log('[Page] Already fixing an error, ignoring duplicate');
      return;
    }
    
    setTimeout(() => {
        if (renderStatus === 'success') {
             isFixingRef.current = false;
             setStatus("idle");
             setAgentMessage("Prototype Ready");
             setHistory(prev => [...prev, { 
                  role: "tool", 
                  parts: [{ functionResponse: { name: 'render_prototype', response: { success: true, message: "Rendered successfully. Ready for user feedback." } } }] 
             }]);
        } else {
            // Only auto-fix if not already fixing
            if (!isFixingRef.current) {
              isFixingRef.current = true;
              setAgentMessage("Auto-fixing Error...");
              console.log('[Page] Sending error to agent for fix:', payload?.slice?.(0, 100) || payload);
              startAgentLoop(undefined, { name: 'render_prototype', response: { success: false, error: payload } });
            }
        }
    }, 500);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
       {/* Header */}
       <header className="h-auto min-h-16 border-b border-white/10 flex items-center px-6 py-3 justify-between bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link href="/" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white border border-white/5 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
                 <div className="flex items-center gap-3">
                   <h1 className="font-semibold text-base truncate max-w-lg">
                     {prototypeTitle || title || "Untitled Prototype"}
                   </h1>
                   <div className={clsx(
                     "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0",
                     status === "idle" 
                       ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                       : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                   )}>
                     <div className={clsx("w-2 h-2 rounded-full", status === "idle" ? "bg-emerald-500" : "bg-blue-500 animate-pulse")} />
                     {status === "idle" ? "Ready" : status === "thinking" ? "Thinking..." : "Rendering..."}
                   </div>
                 </div>
                 {algorithmInfo && (
                   <p className="text-xs text-gray-500 truncate max-w-xl">
                     <span className="text-purple-400">Algorithm:</span> {algorithmInfo}
                   </p>
                 )}
            </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="px-4 py-2 hover:bg-white/10 rounded-xl text-xs font-medium text-gray-400 border border-white/10 transition-colors flex-shrink-0"
          >
             {isSidebarOpen ? "Hide Chat" : "Show Chat"}
          </button>
       </header>

       {/* Workspace - Fixed height container */}
       <div className="flex-1 flex h-[calc(100vh-4rem)]">
           {/* Left: Chat Interface - Independent scroll */}
           <div className={clsx(
               "transition-all duration-300 ease-in-out border-r border-white/10 flex flex-col",
               isSidebarOpen ? "w-[380px] flex-shrink-0" : "w-0 overflow-hidden"
           )}>
               {isSidebarOpen && (
                 <ChatInterface 
                      history={history} 
                      onSendMessage={(msg) => startAgentLoop(msg)} 
                      status={status}
                      currentCode={currentCode}
                      className="h-full w-full" 
                 />
               )}
           </div>

           {/* Right: Prototype - Full screen area */}
           <div className="flex-1 relative bg-gray-900/50 flex flex-col min-w-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

              {/* Central Status Pill (Only shows when loading) */}
              {!currentCode && (
                 <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
                      {status === "thinking" && <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />}
                      <p className="text-gray-500 font-mono text-sm animate-pulse">
                          {status === 'thinking' ? "Analyzing Paper & Designing..." : "Waiting for Agent..."}
                      </p>
                 </div>
              )}

              {/* Rendered Prototype - Full area */}
              {currentCode && (
                <div className="flex-1 relative z-10">
                    <PrototypeRenderer code={currentCode} onRenderStatus={(s, p) => {
                        if (status === 'executing') {
                            handleRenderStatus(s, p);
                        }
                    }} />
                </div>
              )}
           </div>
       </div>
    </main>
  );
}
