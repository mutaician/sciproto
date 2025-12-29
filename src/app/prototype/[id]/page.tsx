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
  
  // We use a ref to track if we need to auto-respond to the agent (e.g. after a tool execution)
  const isAutoLooping = useRef(false);

  // Initial Kickoff
  useEffect(() => {
    if (title && history.length === 0) {
      startAgentLoop(`I need a React simulation for: ${title}. ${description}. 
      Analyze the requirements, then GENERATE the code using the render_prototype function.
      If there are errors, correct them.`);
    }
  }, [title, description]);

  const startAgentLoop = async (userMessage?: string, functionResponse?: any) => {
    setStatus("thinking");
    setAgentMessage(""); // Clear previous message if new turn
    
    // Update history immediately for Optimistic UI
    const newItems = [];
    if (userMessage) {
      newItems.push({ role: "user", parts: [{ text: userMessage }] });
    }
    if (functionResponse) {
       newItems.push({ 
            role: "tool", 
            parts: [{ functionResponse: { name: functionResponse.name, response: functionResponse.response } }] 
       });
    }
    
    // We update local state to show it immediately
    if (newItems.length > 0) {
        setHistory(prev => [...prev, ...newItems]);
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // We pass the *current committed* history plus the new items we just added optimistically
          // The API expects the full context including the new message.
          history: [...history, ...newItems],
          // We also pass explicit message/response fields if the API relies on them for logic handles
          // (Our API does check `message` and `functionResponse` properties to append them too, 
          // so passing `history` as the BASE history without new items might be safer if we want to avoid duplication there).
          // Let's pass the OLD history and let the API append the new message provided in `message` prop.
          // WAIT: In the API:
          // let contents = history || [];
          // if (message) contents.push(...)
          // So if we pass the NEW history in `history` AND `message`, it will duplicate.
          // CORRECT LOGIC: Pass `history` (current state BEFORE update) and `message`.
          history: history, 
          message: userMessage, 
          functionResponse 
        }),
      });
      
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      setStatus("thinking"); // or "streaming"

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: !done });
        
        // Split by newline filter blank
        const lines = chunkValue.split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
           try {
             const json = JSON.parse(line);
             
             if (json.type === "text") {
                const text = json.content;
                accumulatedText += text;
                setAgentMessage(accumulatedText); // Show full accumulated text
            } else if (json.type === "tool_call_part") {
                setStatus("executing");
                
                // The API now sends the FULL part object { functionCall: {name, args, ...}, ... }
                const part = json.part;
                const toolCall = part.functionCall;
                
                // Add Assistant turn to history with SPLIT parts
                const newParts: any[] = [];
                if (accumulatedText) {
                    newParts.push({ text: accumulatedText });
                }
                
                // Push the EXACT part received from API to preserve metadata (thought_signature)
                newParts.push(part);

                setHistory(prev => [...prev, { 
                    role: "model", 
                    parts: newParts
                }]);

                if (toolCall.name === "render_prototype") {
                    const args = toolCall.args;
                    // Fix: args might be a string (json) or object depending on SDK
                    let code = "";
                    if (typeof args === 'string') {
                         try { code = JSON.parse(args).code; } catch (e) { console.error(e); }
                    } else {
                         code = args.code;
                    }

                    if (code) {
                        setCurrentCode(code);
                        // We will report status via the onRenderStatus callback from the renderer
                    }
                }
            } else if (json.type === "tool_call") {
                // Legacy fallback
                const toolCall = json.tool;
                 // Add Assistant turn to history with SPLIT parts
                const newParts: any[] = [];
                if (accumulatedText) {
                    newParts.push({ text: accumulatedText });
                }
                newParts.push({ functionCall: toolCall });
                
                 setHistory(prev => [...prev, { 
                    role: "model", 
                    parts: newParts
                }]);
                
                if (toolCall.name === "render_prototype") {
                     const args = toolCall.args;
                     let code = args.code || (typeof args === 'string' ? JSON.parse(args).code : "");
                     if (code) setCurrentCode(code);
                }
            }
           } catch (e) {
             console.error("JSON Parse Error in stream", e);
           }
        }
      }
      
      // End of stream
      if (status !== "executing") {
          setStatus("idle");
          // Add text-only turn if no tool called
           setHistory(prev => [...prev, { role: "model", parts: [{ text: accumulatedText }] }]);
      }

    } catch (e) {
      console.error(e);
      setAgentMessage("Agent crashed. Please restart.");
      setStatus("idle");
    }
  };

  const handleRenderStatus = (status: 'success' | 'error', payload: any) => {
    // Only respond if we are in the executing state to avoid double-firing
    // or firing on initial mounts if not strictly controlled.
    // In this simple loop, we assume the last action was tool call.
    
    // We delay slightly to let the user see the result
    setTimeout(() => {
        if (status === 'success') {
            // Only report success if we were waiting for it (simple check)
             startAgentLoop(undefined, { name: 'render_prototype', response: { success: true, message: "Rendered successfully." } });
        } else {
            // If error, setting status to 'thinking' creates "reset" feeling.
            // Let's make it clear.
            setAgentMessage("Runtime Error detected! Auto-fixing...");
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
              <p className="text-xs text-gray-400">Agent Mode: {status.toUpperCase()}</p>
            </div>
          </div>
       </header>

       {/* Workspace */}
       <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

            {/* Agent Status/Message Overlay */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-auto max-w-2xl px-4 pointer-events-none">
                  <div className={clsx(
                      "px-4 py-2 rounded-full border backdrop-blur-md flex items-center gap-3 transition-all pointer-events-auto shadow-2xl",
                      status === "thinking" ? "bg-blue-500/20 border-blue-500/50" : 
                      status === "executing" ? "bg-purple-500/20 border-purple-500/50" :
                      "bg-black/80 border-white/20"
                  )}>
                     {status === "thinking" && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
                     {status === "executing" && <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />}
                     
                     <span className="text-sm font-mono text-gray-200">
                         {status === "thinking" ? "Agent is coding..." : 
                          status === "executing" ? "Compiling & Rendering..." : 
                          agentMessage || "Agent standing by."}
                     </span>
                  </div>
             </div>

           {currentCode ? (
              <div className="flex-1 w-full h-full relative">
                  <PrototypeRenderer code={currentCode} onRenderStatus={(s, p) => {
                      if (status === 'executing') {
                          handleRenderStatus(s, p);
                      }
                  }} />
              </div>
           ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 font-mono">
               Waiting for Agent to generate prototype...
            </div>
          )}
       </div>
    </main>
  );
}
