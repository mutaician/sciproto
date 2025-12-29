"use client";

import React, { useEffect, useRef, useState } from "react";

interface PrototypeRendererProps {
  code: string;
  onRenderStatus?: (status: 'success' | 'error', payload: any) => void;
}

export default function PrototypeRenderer({ code, onRenderStatus }: PrototypeRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current || !code) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Reset error
    setError(null);

    // 1. Setup the HTML Shell with Import Map and Babel
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          
          <!-- Import Map: Maps standard names to ESM CDNs -->
          <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@18.2.0",
              "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
              "recharts": "https://esm.sh/recharts@2.12.7?deps=react@18.2.0,react-dom@18.2.0",
              "lucide-react": "https://esm.sh/lucide-react@0.368.0?deps=react@18.2.0,react-dom@18.2.0",
              "framer-motion": "https://esm.sh/framer-motion@11.0.24?deps=react@18.2.0,react-dom@18.2.0",
              "clsx": "https://esm.sh/clsx@2.1.0",
              "tailwind-merge": "https://esm.sh/tailwind-merge@2.2.2"
            }
          }
          </script>

          <!-- Babel for client-side JSX compilation -->
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

          <style>
             html, body { margin: 0; padding: 0; width: 100vw; min-height: 100vh; overflow-x: hidden; overflow-y: auto; background: transparent; }
             #root { width: 100%; min-height: 100vh; display: flex; flex-direction: column; }
             .recharts-responsive-container { min-height: 0 !important; flex: 1; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
             import { createRoot } from 'react-dom/client';
             import React from 'react';

             // Error Handling
             window.onerror = (msg, url, line) => {
                 window.parent.postMessage({ type: 'RENDER_ERROR', message: msg + ' (Line ' + line + ')' }, '*');
             };

             // We will dynamically import the user code as a module
             async function run() {
                try {
                   // 1. Get Code from Parent (injected via template literal below)
                   const rawCode = \`${code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                   
                   // 2. Transpile JSX -> JS (preserving imports)
                   // Babel standalone usage
                   // We add 'typescript' preset to handle type annotations
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
                   if (!App) throw new Error("No default export found in component.");

                   const root = createRoot(document.getElementById('root'));
                   root.render(React.createElement(App));
                   
                   window.parent.postMessage({ type: 'RENDER_SUCCESS' }, '*');

                } catch (e) {
                   console.error(e);
                   window.parent.postMessage({ type: 'RENDER_ERROR', message: e.message }, '*');
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

    // Event Listener setup
    const messageHandler = (e: MessageEvent) => {
        if (e.data?.type === 'RENDER_ERROR') {
            setError(e.data.message);
            onRenderStatus?.('error', e.data.message);
        } else if (e.data?.type === 'RENDER_SUCCESS') {
            onRenderStatus?.('success', {});
        }
    };
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);

  }, [code]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black/20">
       <iframe ref={iframeRef} className="w-full h-full border-none" />
       {error && (
         <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-white p-4 rounded border border-red-500 z-50 font-mono text-sm shadow-xl">
            <div className="font-bold mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"/> Runtime Error
            </div>
            {error}
         </div>
       )}
    </div>
  );
}
