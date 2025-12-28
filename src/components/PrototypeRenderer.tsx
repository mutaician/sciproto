"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * !CRITICAL WARNING!
 * This component executes arbitrary code from the LLM. 
 * IN A PRODUCTION APP, THIS MUST BE SANDBOXED (e.g., iframe, Sandpack).
 * For this Hackathon Prototype, we are using a direct execution approach 
 * but with awareness of the risks.
 */

interface PrototypeRendererProps {
  code: string;
}

export default function PrototypeRenderer({ code }: PrototypeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !code) return;

    // Clear previous
    containerRef.current.innerHTML = "";
    setRuntimeError(null);

    try {
      // 1. Prepare data for the evaluation scope
      // We will wrap the code in a function that returns the component or mounts it
      // Since we can't easily compile JSX in browser without Babel/swc-wasm (too heavy for this step),
      // we will prompt Gemini to output raw HTML/JS or use a very simple unexpected regex to strip imports.
      // 
      // BETTER APPROACH for Hackathon:
      // We assume Gemini returns a module that exports a default function.
      // We'll use a Blob URL to import it dynamically? No, that requires no deps.
      //
      // ACTUAL APPROACH:
      // We will inject the code into an iframe srcDoc. This is the standard way to handle this safely and easily.
      
      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.className = "w-full h-full"; // Tailwind classes won't apply inside check later
      
      // Construct the HTML for the iframe
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            
            <!-- Recharts for plotting -->
            <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
            
            <style>
              body { background: transparent; color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; font-family: sans-serif; }
              #root { width: 100%; height: 100%; padding: 20px; }
            </style>
          </head>
          <body>
            <div id="root"></div>
            <script type="text/babel">
              const { useState, useEffect, useMemo, useRef } = React;
              const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } = Recharts;

              // Error Boundary
              class ErrorBoundary extends React.Component {
                constructor(props) {
                  super(props);
                  this.state = { hasError: false, error: null };
                }
                static getDerivedStateFromError(error) {
                  return { hasError: true, error };
                }
                render() {
                  if (this.state.hasError) {
                    return <div className="text-red-500 p-4 bg-red-900/20 rounded">Runtime Error: {this.state.error.message}</div>;
                  }
                  return this.props.children;
                }
              }

              // The Generated Code
              ${code}

              // Mount
              const root = ReactDOM.createRoot(document.getElementById('root'));
              // We assume the generated code defines a component named 'App' or 'Simulation'
              // Or we ask the model to call 'render(<App />)' itself, but easier if we do it.
              
              // Try to find the component
              const TargetComponent = (typeof Simulation !== 'undefined') ? Simulation : 
                                    (typeof App !== 'undefined') ? App : 
                                    (typeof Prototype !== 'undefined') ? Prototype : null;

              if (TargetComponent) {
                root.render(
                  <ErrorBoundary>
                    <TargetComponent />
                  </ErrorBoundary>
                );
              } else {
                root.render(<div className="text-yellow-500">Could not find component 'Simulation', 'App', or 'Prototype' to render.</div>);
              }
            </script>
          </body>
        </html>
      `;

      iframe.srcdoc = htmlContent;
      containerRef.current.appendChild(iframe);

    } catch (e: any) {
      setRuntimeError(e.message);
    }
  }, [code]);

  return (
    <div className="w-full h-full min-h-[600px] bg-black/20 border border-white/10 rounded-xl overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
      {runtimeError && (
        <div className="absolute top-4 left-4 right-4 bg-red-900/90 text-white p-4 rounded border border-red-500 z-50">
           {runtimeError}
        </div>
      )}
    </div>
  );
}
