"use client";

import { useEffect, useState, useRef, use, useCallback, memo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Bot, User, Loader2 } from "lucide-react";
import PrototypeRenderer from "@/components/PrototypeRenderer";

// ============================================================================
// TYPES
// ============================================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// ============================================================================
// CHAT PANEL - Isolated component, changes here don't affect prototype
// ============================================================================

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

const ChatPanel = memo(function ChatPanel({ messages, isLoading, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Filter out initial context messages for display
  const visibleMessages = messages.filter(m => 
    !(m.role === "user" && (m.content.includes("PAPER CONTENT:") || m.content.startsWith("Create an interactive prototype")))
  );

  return (
    <div className="w-80 border-r border-white/10 flex flex-col bg-black/40 shrink-0">
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
            <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-sm ${
              msg.role === "user" 
                ? "bg-white/10 rounded-tr-sm" 
                : "bg-blue-500/10 rounded-tl-sm border border-blue-500/10"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content || (msg.isStreaming ? "..." : "")}</p>
              {msg.isStreaming && msg.content && (
                <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse ml-1" />
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

      {/* Input - isolated, typing here doesn't re-render prototype */}
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
  // Only re-render if code changes - ignore onError ref changes
  return prevProps.code === nextProps.code;
});

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function PrototypePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Untitled";
  const description = searchParams.get("description") || "";
  const hash = searchParams.get("hash");

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [prototypeCode, setPrototypeCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paperContext, setPaperContext] = useState("");

  // Refs for callbacks (stable references)
  const messagesRef = useRef<Message[]>([]);
  const isLoadingRef = useRef(false);
  const hasStarted = useRef(false);

  // Keep refs in sync
  messagesRef.current = messages;
  isLoadingRef.current = isLoading;

  console.log("[Prototype] Loading:", resolvedParams.id);

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

  // The main send function - uses refs to avoid dependency issues
  const sendMessage = useCallback(async (content: string) => {
    if (isLoadingRef.current) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    const userMsg: Message = { id: userMsgId, role: "user", content };
    const assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "", isStreaming: true };

    // Add messages
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      // Build history for API
      const historyForApi = [...messagesRef.current, userMsg].map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: historyForApi }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

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
              if (code) setPrototypeCode(code);
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

      // Mark complete
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, isStreaming: false } : m
      ));

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
  }, []);

  // Handle prototype errors - stable callback
  const handlePrototypeError = useCallback((error: string) => {
    if (!isLoadingRef.current) {
      sendMessage(`The prototype has an error: ${error}\n\nPlease fix it.`);
    }
  }, [sendMessage]);

  // Auto-start agent when ready
  useEffect(() => {
    if (hasStarted.current || !title) return;
    if (hash && !paperContext) return;
    
    hasStarted.current = true;
    const initialPrompt = paperContext
      ? `Create an interactive prototype for "${title}". Description: ${description}\n\nPAPER CONTENT:\n${paperContext}`
      : `Create an interactive prototype for "${title}". Description: ${description}`;
    
    sendMessage(initialPrompt);
  }, [title, description, hash, paperContext, sendMessage]);

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center px-4 gap-4 bg-black/80 backdrop-blur shrink-0">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-medium text-sm truncate">{title}</h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          isLoading ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
        }`}>
          <div className={`w-2 h-2 rounded-full ${isLoading ? "bg-blue-400 animate-pulse" : "bg-emerald-400"}`} />
          {isLoading ? "Working..." : "Ready"}
        </div>
      </header>

      {/* Main Content - Chat and Prototype are isolated */}
      <div className="flex-1 flex min-h-0">
        <ChatPanel 
          messages={messages} 
          isLoading={isLoading} 
          onSendMessage={sendMessage} 
        />
        <PrototypePanel 
          code={prototypeCode} 
          onError={handlePrototypeError} 
        />
      </div>
    </main>
  );
}
