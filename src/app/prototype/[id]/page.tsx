"use client";

import { useEffect, useState, useRef, use, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2, PanelLeftClose, PanelLeft, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import PrototypeRenderer from "@/components/PrototypeRenderer";

// ============================================================================
// TYPES
// ============================================================================

// A message can have text AND/OR a function call
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  // Function call made by assistant
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  // Function response (for user role, providing result of function call)
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

type ChatWidth = "narrow" | "normal" | "wide";

// ============================================================================
// CHAT PANEL - Isolated component with markdown support
// ============================================================================

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  width: ChatWidth;
  onWidthChange: (width: ChatWidth) => void;
}

const ChatPanel = memo(function ChatPanel({ messages, isLoading, onSendMessage, width, onWidthChange }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Width classes
  const widthClasses = {
    narrow: "w-72",
    normal: "w-96",
    wide: "w-[600px]"
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const cycleWidth = () => {
    const order: ChatWidth[] = ["narrow", "normal", "wide"];
    const currentIdx = order.indexOf(width);
    const nextIdx = (currentIdx + 1) % order.length;
    onWidthChange(order[nextIdx]);
  };

  // Filter out hidden messages for display:
  // - Initial context messages (paper content, initial prompt)
  // - Function response messages (internal bookkeeping)
  const visibleMessages = messages.filter(m => {
    // Hide initial prompts
    if (m.role === "user" && (m.content.includes("PAPER CONTENT:") || m.content.startsWith("Create an interactive prototype"))) {
      return false;
    }
    // Hide function response messages (they're for the model, not the user)
    if (m.functionResponse) {
      return false;
    }
    return true;
  });

  return (
    <div className={`${widthClasses[width]} border-r border-white/10 flex flex-col bg-black/40 shrink-0 transition-all duration-300`}>
      {/* Header with width toggle */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-gray-300">Research Assistant</span>
        </div>
        <button
          onClick={cycleWidth}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          title={`Current: ${width}. Click to change.`}
        >
          {width === "wide" ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {visibleMessages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-sm text-gray-400">Ask me anything about the prototype</p>
          </div>
        )}

        {visibleMessages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === "user" ? "bg-white/10" : "bg-blue-500/20"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
            </div>
            <div className={`rounded-2xl px-3 py-2 max-w-[90%] text-sm ${
              msg.role === "user" 
                ? "bg-white/10 rounded-tr-sm" 
                : "bg-blue-500/10 rounded-tl-sm border border-blue-500/10"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                  <ReactMarkdown>{msg.content || (msg.isStreaming ? "..." : "")}</ReactMarkdown>
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-1" />
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && visibleMessages.length === 0 && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
            <div className="bg-blue-500/10 rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-gray-400">
              Analyzing paper and generating prototype...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isLoading ? "Agent is working..." : "Ask for changes..."}
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-gray-500 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
});

// ============================================================================
// PROTOTYPE PANEL - Completely isolated from chat state
// ============================================================================

interface PrototypePanelProps {
  code: string;
  onError: (error: string) => void;
}

const PrototypePanel = memo(function PrototypePanel({ code, onError }: PrototypePanelProps) {
  const handleRenderStatus = useCallback((status: 'success' | 'error', payload: string) => {
    if (status === "error") {
      onError(payload);
    }
  }, [onError]);

  if (!code) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-900/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
        <p className="text-sm">Generating prototype...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-gray-900/50 min-w-0">
      <PrototypeRenderer code={code} onRenderStatus={handleRenderStatus} />
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.code === nextProps.code;
});

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PrototypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const prototypeId = resolvedParams.id;
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Untitled";
  const description = searchParams.get("description") || "";
  const hash = searchParams.get("hash");

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [prototypeCode, setPrototypeCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paperContext, setPaperContext] = useState("");
  const [chatWidth, setChatWidth] = useState<ChatWidth>("normal");
  const [isSaved, setIsSaved] = useState(true);
  const [cacheCheckComplete, setCacheCheckComplete] = useState(false);
  const [isLoadedFromCache, setIsLoadedFromCache] = useState(false);

  // Refs
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  const hasStarted = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync
  messagesRef.current = messages;
  isLoadingRef.current = isLoading;

  // ========== CACHING ==========
  
  // Load from cache on mount
  useEffect(() => {
    async function loadFromCache() {
      try {
        const res = await fetch(`/api/prototypes?id=${encodeURIComponent(prototypeId)}`);
        if (res.ok) {
          const cached = await res.json();
          if (cached && cached.code) {
            console.log("[Prototype] Loaded from cache:", cached.title);
            setPrototypeCode(cached.code);
            // Convert cached history to messages format
            // Properly restore function calls and function responses
            if (cached.history && cached.history.length > 0) {
              const msgs: Message[] = cached.history.map((h: { 
                role: string; 
                parts: Array<{ 
                  text?: string; 
                  functionCall?: { name: string; args: Record<string, unknown> };
                  functionResponse?: { name: string; response: Record<string, unknown> };
                }>;
              }, i: number) => {
                const textPart = h.parts?.find(p => p.text !== undefined);
                const functionCallPart = h.parts?.find(p => p.functionCall);
                const functionResponsePart = h.parts?.find(p => p.functionResponse);
                
                return {
                  id: `cached-${i}`,
                  role: h.role === "model" ? "assistant" : "user",
                  content: textPart?.text || "",
                  isStreaming: false,
                  functionCall: functionCallPart?.functionCall,
                  functionResponse: functionResponsePart?.functionResponse,
                } as Message;
              });
              setMessages(msgs);
            }
            setIsLoadedFromCache(true);
            hasStarted.current = true;
          }
        }
      } catch {
        console.log("[Prototype] Not in cache, will generate new");
      } finally {
        // Mark cache check as complete (whether found or not)
        setCacheCheckComplete(true);
      }
    }
    loadFromCache();
  }, [prototypeId]);

  // Auto-save with debounce
  // Save whenever prototypeCode changes (whether new or from cache)
  useEffect(() => {
    if (!prototypeCode) return;
    
    setIsSaved(false);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Convert messages to history format for storage
        // Properly include function calls and function responses
        const historyForStorage = messages.map(m => {
          const role = m.role === "assistant" ? "model" : "user";
          const parts: Array<{ text?: string; functionCall?: unknown; functionResponse?: unknown }> = [];
          
          if (m.content) {
            parts.push({ text: m.content });
          }
          if (m.functionCall) {
            parts.push({ functionCall: m.functionCall });
          }
          if (m.functionResponse) {
            parts.push({ functionResponse: m.functionResponse });
          }
          if (parts.length === 0) {
            parts.push({ text: "" });
          }
          
          return { role, parts };
        });
        
        await fetch("/api/prototypes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: prototypeId,
            paper_hash: hash,
            title,
            description,
            code: prototypeCode,
            history: historyForStorage,
          }),
        });
        setIsSaved(true);
        console.log("[Prototype] Saved to cache");
      } catch (e) {
        console.error("[Prototype] Failed to save:", e);
      }
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [prototypeCode, messages, prototypeId, hash, title, description]);

  // Load paper context
  useEffect(() => {
    if (!hash) return;
    fetch("/api/papers")
      .then(r => r.json())
      .then(data => {
        const paper = data.papers?.find((p: { hash: string }) => p.hash === hash);
        if (paper) setPaperContext(paper.raw_text);
      })
      .catch(console.error);
  }, [hash]);

  // Convert our Message format to Gemini's expected history format
  // This properly includes function calls and function responses
  const buildHistoryForApi = useCallback((msgs: Message[]) => {
    return msgs.map(m => {
      const role = m.role === "assistant" ? "model" : "user";
      const parts: Array<{ text?: string; functionCall?: unknown; functionResponse?: unknown }> = [];

      // Add text part if present
      if (m.content) {
        parts.push({ text: m.content });
      }

      // Add function call part if present (for assistant/model messages)
      if (m.functionCall) {
        parts.push({
          functionCall: {
            name: m.functionCall.name,
            args: m.functionCall.args
          }
        });
      }

      // Add function response part if present (for user messages providing function result)
      if (m.functionResponse) {
        parts.push({
          functionResponse: {
            name: m.functionResponse.name,
            response: m.functionResponse.response
          }
        });
      }

      // Ensure at least empty text if no parts
      if (parts.length === 0) {
        parts.push({ text: "" });
      }

      return { role, parts };
    });
  }, []);

  // The main send function
  const sendMessage = useCallback(async (content: string) => {
    if (isLoadingRef.current) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const userMsg: Message = { id: userMsgId, role: "user", content };
    const assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "", isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      // Build history in Gemini's expected format
      // This properly includes function calls and function responses
      const historyForApi = buildHistoryForApi([...messagesRef.current, userMsg]);

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyForApi }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let receivedFunctionCall: { name: string; args: Record<string, unknown> } | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            if (json.type === "text" && json.content) {
              accumulatedText += json.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
              ));
            }

            if (json.type === "tool_call" && json.name === "render_prototype") {
              let code = json.args?.code || "";
              code = code.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
              if (code) {
                setPrototypeCode(code);
                // Store the function call so it goes into history
                receivedFunctionCall = { name: json.name, args: json.args };
              }
            }

            if (json.type === "error") {
              accumulatedText += `\n⚠️ Error: ${json.message}`;
              setMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
              ));
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Finalize the assistant message with function call if present
      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === assistantMsgId 
            ? { ...m, isStreaming: false, functionCall: receivedFunctionCall } 
            : m
        );
        
        // If there was a function call, add a function response message
        // This tells the model what happened when we executed the function
        if (receivedFunctionCall) {
          const functionResponseMsg: Message = {
            id: crypto.randomUUID(),
            role: "user", // Function responses are sent as "user" role in Gemini
            content: "",
            functionResponse: {
              name: receivedFunctionCall.name,
              response: { success: true, rendered: true }
            }
          };
          return [...updated, functionResponseMsg];
        }
        
        return updated;
      });

    } catch (error) {
      console.error("Agent error:", error);
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId 
          ? { ...m, content: "Failed to connect to agent. Please try again.", isStreaming: false } 
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [buildHistoryForApi]);

  // Handle prototype errors
  const handlePrototypeError = useCallback((error: string) => {
    if (!isLoadingRef.current) {
      sendMessage(`The prototype has an error: ${error}\n\nPlease fix it.`);
    }
  }, [sendMessage]);

  // Auto-start agent when ready (only if not loaded from cache)
  useEffect(() => {
    // Wait for cache check to complete before deciding to auto-start
    if (!cacheCheckComplete) return;
    
    // Don't start if already started or loaded from cache
    if (hasStarted.current || isLoadedFromCache) return;
    if (!title) return;
    if (hash && !paperContext) return;
    
    hasStarted.current = true;
    const initialPrompt = paperContext
      ? `Create an interactive prototype for "${title}". Description: ${description}\n\nPAPER CONTENT:\n${paperContext}`
      : `Create an interactive prototype for "${title}". Description: ${description}`;
    
    sendMessage(initialPrompt);
  }, [cacheCheckComplete, title, description, hash, paperContext, sendMessage, isLoadedFromCache]);

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center px-4 gap-4 bg-black/80 backdrop-blur shrink-0">
        <Link 
          href={hash ? `/papers/${hash}` : "/papers"} 
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-medium text-sm truncate">{title}</h1>
        </div>
        
        {/* Save Status */}
        {prototypeCode && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs ${
            isSaved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
          }`}>
            <Save className="w-3 h-3" />
            {isSaved ? "Saved" : "Saving..."}
          </div>
        )}
        
        {/* Status */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          isLoading ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-blue-400 animate-pulse" : "bg-emerald-400"}`} />
          {isLoading ? "Working..." : "Ready"}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <ChatPanel 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={sendMessage}
          width={chatWidth}
          onWidthChange={setChatWidth}
        />
        <PrototypePanel 
          code={prototypeCode} 
          onError={handlePrototypeError} 
        />
      </div>
    </main>
  );
}
