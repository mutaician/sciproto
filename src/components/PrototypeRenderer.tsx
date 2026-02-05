"use client";

import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface PrototypeRendererProps {
  code: string;
  onRenderStatus?: (status: 'success' | 'error', payload: any) => void;
}

// Maximum retry attempts for auto-fix
const MAX_RETRIES = 3;

// Memoized to prevent re-renders when parent state changes
const PrototypeRenderer = memo(function PrototypeRenderer({ code, onRenderStatus }: PrototypeRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track retries across code changes - use refs for values not needed in render
  const lastErrorRef = useRef<string | null>(null);
  const hasReportedErrorRef = useRef(false);

  const renderCode = useCallback((codeToRender: string) => {
    if (!iframeRef.current || !codeToRender) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Reset error and set loading
    setError(null);
    setIsLoading(true);

    // Enhanced HTML Shell with more libraries
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          
          <!-- Import Map: Extended library support -->
          <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@18.2.0",
              "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
              "recharts": "https://esm.sh/recharts@2.12.7?deps=react@18.2.0,react-dom@18.2.0",
              "lucide-react": "https://esm.sh/lucide-react@0.368.0?deps=react@18.2.0,react-dom@18.2.0",
              "framer-motion": "https://esm.sh/framer-motion@11.0.24?deps=react@18.2.0,react-dom@18.2.0",
              "clsx": "https://esm.sh/clsx@2.1.0",
              "tailwind-merge": "https://esm.sh/tailwind-merge@2.2.2",
              "d3": "https://esm.sh/d3@7.8.5",
              "d3-scale": "https://esm.sh/d3-scale@4.0.2",
              "d3-shape": "https://esm.sh/d3-shape@3.2.0",
              "d3-array": "https://esm.sh/d3-array@3.2.4",
              "d3-interpolate": "https://esm.sh/d3-interpolate@3.0.1",
              "three": "https://esm.sh/three@0.162.0",
              "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.19?deps=react@18.2.0,react-dom@18.2.0,three@0.162.0",
              "@react-three/drei": "https://esm.sh/@react-three/drei@9.99.0?deps=react@18.2.0,react-dom@18.2.0,three@0.162.0",
              "mathjs": "https://esm.sh/mathjs@12.4.0",
              "lodash": "https://esm.sh/lodash@4.17.21",
              "zustand": "https://esm.sh/zustand@4.5.2?deps=react@18.2.0"
            }
          }
          </script>

          <!-- Babel for client-side JSX compilation -->
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

          <style>
             html, body { 
               margin: 0; 
               padding: 0; 
               width: 100vw; 
               min-height: 100vh; 
               overflow-x: hidden; 
               overflow-y: auto; 
               background: #030712; /* gray-950 */
               color: white;
             }
             #root { 
               width: 100%; 
               min-height: 100vh; 
               display: flex; 
               flex-direction: column; 
             }
             .recharts-responsive-container { min-height: 0 !important; flex: 1; }
             
             /* Custom scrollbar */
             ::-webkit-scrollbar { width: 8px; height: 8px; }
             ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
             ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
             ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
             
             /* Loading animation */
             @keyframes pulse {
               0%, 100% { opacity: 1; }
               50% { opacity: 0.5; }
             }
             .loading-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="flex items-center justify-center min-h-screen">
              <div class="loading-pulse text-gray-500">Loading prototype...</div>
            </div>
          </div>
          <script type="module">
             import { createRoot } from 'react-dom/client';
             import React from 'react';

             // Enhanced Error Handling
             window.onerror = (msg, url, line, col, error) => {
                 const errorInfo = {
                   message: msg,
                   line: line,
                   column: col,
                   stack: error?.stack
                 };
                 console.error('Runtime Error:', errorInfo);
                 window.parent.postMessage({ 
                   type: 'RENDER_ERROR', 
                   message: msg + (line ? ' (Line ' + line + ')' : ''),
                   details: errorInfo
                 }, '*');
                 return true; // Prevent default error handling
             };
             
             // Catch unhandled promise rejections
             window.onunhandledrejection = (event) => {
                 console.error('Unhandled Promise Rejection:', event.reason);
                 window.parent.postMessage({ 
                   type: 'RENDER_ERROR', 
                   message: 'Async Error: ' + (event.reason?.message || String(event.reason))
                 }, '*');
             };

             async function run() {
                try {
                   // 1. Get Code from Parent
                   const rawCode = \`${codeToRender.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                   
                   // 2. Transpile JSX -> JS
                   const output = Babel.transform(rawCode, {
                     presets: [
                        ['react', { runtime: 'classic' }],
                        ['typescript', { isTSX: true, allExtensions: true }]
                     ],
                     filename: 'App.tsx',
                   });
                   
                   const transpiledCode = output.code;

                   // 3. Create a Blob URL for the module
                   const blob = new Blob([transpiledCode], { type: 'text/javascript' });
                   const url = URL.createObjectURL(blob);

                   // 4. Dynamic Import
                   const module = await import(url);
                   
                   // 5. Render
                   const App = module.default;
                   if (!App) throw new Error("No default export found. Make sure to use 'export default function App()'");

                   const rootEl = document.getElementById('root');
                   rootEl.innerHTML = ''; // Clear loading state
                   
                   const root = createRoot(rootEl);
                   root.render(React.createElement(App));
                   
                   // Small delay to ensure render completes
                   setTimeout(() => {
                     window.parent.postMessage({ type: 'RENDER_SUCCESS' }, '*');
                   }, 100);

                } catch (e) {
                   console.error('Render Error:', e);
                   
                   // Parse error for better messages
                   let errorMessage = e.message;
                   if (e.message.includes('Unexpected token')) {
                     errorMessage = 'Syntax Error: ' + e.message;
                   } else if (e.message.includes('is not defined')) {
                     errorMessage = 'Missing Import: ' + e.message;
                   }
                   
                   window.parent.postMessage({ 
                     type: 'RENDER_ERROR', 
                     message: errorMessage,
                     stack: e.stack
                   }, '*');
                }
             }

             run();
          </script>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();
  }, []);

  useEffect(() => {
    if (!code) return;
    
    // Reset the "reported" flag when we get new code (agent sent a fix)
    hasReportedErrorRef.current = false;
    
    renderCode(code);

    // Event Listener setup
    const messageHandler = (e: MessageEvent) => {
        // Ignore messages from other sources
        if (e.source !== iframeRef.current?.contentWindow) return;
        
        setIsLoading(false);
        
        if (e.data?.type === 'RENDER_ERROR') {
            const errorMsg = e.data.message;
            setError(errorMsg);
            
            lastErrorRef.current = errorMsg;
            
            // Increment retry count
            setRetryCount(prev => {
              const newCount = prev + 1;
              console.log(`[Renderer] Error #${newCount}/${MAX_RETRIES}: ${errorMsg.slice(0, 100)}`);
              
              // Only trigger auto-fix if:
              // 1. We haven't exceeded retry limit
              // 2. We haven't already reported this specific render attempt's error
              if (newCount <= MAX_RETRIES && !hasReportedErrorRef.current) {
                hasReportedErrorRef.current = true; // Prevent double-reporting
                onRenderStatus?.('error', errorMsg);
              } else if (newCount > MAX_RETRIES) {
                console.log('[Renderer] Max retries reached, stopping auto-fix. User can manually retry.');
              }
              return newCount;
            });
        } else if (e.data?.type === 'RENDER_SUCCESS') {
            setError(null);
            // Reset retry count on success
            setRetryCount(0);
            lastErrorRef.current = null;
            onRenderStatus?.('success', {});
        }
    };
    
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);

  }, [code, onRenderStatus, renderCode]);

  const handleDismissError = () => {
    setError(null);
  };

  const handleManualRetry = () => {
    // Reset retry count and allow another round of auto-fixes
    setRetryCount(0);
    hasReportedErrorRef.current = false;
    if (code && error) {
      onRenderStatus?.('error', error);
    }
  };

  return (
    <div className="w-full h-full bg-gray-950 relative">
       {/* Loading overlay */}
       {isLoading && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-40">
           <div className="flex items-center gap-3 text-gray-400">
             <RefreshCw className="w-5 h-5 animate-spin" />
             <span>Rendering prototype...</span>
           </div>
         </div>
       )}
       
       <iframe 
         ref={iframeRef} 
         className="w-full h-full border-none" 
         sandbox="allow-scripts allow-same-origin"
         title="Prototype Preview"
       />
       
       {/* Error display */}
       {error && (
         <div className="absolute bottom-4 left-4 right-4 bg-red-950/95 text-white p-4 rounded-xl border border-red-500/50 z-50 font-mono text-sm shadow-2xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-bold mb-2 flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Render Error</span>
                    {retryCount > 0 && retryCount < MAX_RETRIES && (
                      <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded">
                        Auto-fixing... ({retryCount}/{MAX_RETRIES})
                      </span>
                    )}
                    {retryCount >= MAX_RETRIES && (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        Max retries reached
                      </span>
                    )}
                </div>
                <div className="text-red-200 break-words">{error}</div>
              </div>
              <div className="flex items-center gap-2">
                {retryCount >= MAX_RETRIES && (
                  <button 
                    onClick={handleManualRetry}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Retry"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={handleDismissError}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
         </div>
       )}
    </div>
  );
});

export default PrototypeRenderer;
