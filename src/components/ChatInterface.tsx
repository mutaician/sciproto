import { useRef, useEffect, useState } from "react";
import { Send, User, Bot, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface ChatInterfaceProps {
  history: any[]; // Google Generative AI History format or custom
  onSendMessage: (message: string) => void;
  status: "idle" | "thinking" | "executing" | "waiting_for_user";
  className?: string;
}

export default function ChatInterface({ history, onSendMessage, status, className }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status !== "idle") return;
    onSendMessage(input);
    setInput("");
  };

  // Helper to extract text from "parts"
  const getMessageText = (parts: any[]) => {
    return parts.map(p => p.text || "").join("").trim();
  };

  // Helper to check if message has a tool call
  const hasToolCall = (parts: any[]) => {
      return parts.some(p => p.functionCall || p.functionResponse);
  };

  return (
    <div className={clsx("flex flex-col h-full bg-black/40 border-r border-white/10 backdrop-blur-md", className)}>
      
      {/* Title */}
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
         <Sparkles className="w-4 h-4 text-blue-400" />
         <h2 className="font-semibold text-sm tracking-wide text-gray-200">RESEARCH ASSISTANT</h2>
      </div>

      {/* Messages List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
         {history.filter(msg => msg.role !== 'tool').map((msg, idx) => {
             const isUser = msg.role === 'user';
             const text = getMessageText(msg.parts);
             const isTool = hasToolCall(msg.parts);

             if (!text && !isTool) return null; // Skip empty

             return (
                 <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
                 >
                    <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        isUser ? "bg-white/10" : "bg-blue-500/20 text-blue-400"
                    )}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={clsx(
                        "rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed",
                        isUser ? "bg-white/10 text-white rounded-tr-none" : "bg-blue-500/10 text-gray-200 rounded-tl-none border border-blue-500/10"
                    )}>
                        {text && <div className="whitespace-pre-wrap">{text}</div>}
                        
                        {/* Tool Call Indicator */}
                        {isTool && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-blue-300/70 font-mono bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10">
                                <Sparkles className="w-3 h-3" />
                                <span>Updated Prototype</span>
                            </div>
                        )}
                    </div>
                 </motion.div>
             );
         })}
         
         {/* Typing Indicator */}
         {status === "thinking" && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                     <Bot className="w-4 h-4" />
                 </div>
                 <div className="bg-blue-500/5 rounded-2xl p-4 rounded-tl-none flex items-center gap-1">
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                     <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                 </div>
             </motion.div>
         )}

         {/* Error Indicator */}
        {status === "executing" && (
            <div className="flex justify-center">
                 <span className="text-xs text-purple-400 font-mono animate-pulse">Running Simulation Code...</span>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
          <form onSubmit={handleSubmit} className="relative">
              <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={status === "idle" ? "Ask a question or request changes..." : "Agent is working..."}
                  disabled={status !== "idle"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || status !== "idle"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-500 text-black hover:bg-blue-400 transition-colors disabled:opacity-0 disabled:pointer-events-none"
              >
                  <Send className="w-4 h-4" />
              </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-gray-600">Gemini 3 Flash • Full Context Active</p>
          </div>
      </div>
    </div>
  );
}
