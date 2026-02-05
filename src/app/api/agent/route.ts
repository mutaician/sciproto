import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// ============================================================================
// SYSTEM INSTRUCTION - Smart agent for proving research paper concepts
// ============================================================================

const systemInstruction = `You are SciProto AI, a helpful assistant that can create interactive prototypes from research papers.

## YOUR ROLE
You're a conversational AI assistant. You can:
1. Answer questions about the paper or prototype
2. Explain concepts and algorithms
3. Create or update prototypes ONLY when the user asks for changes

## WHEN TO USE render_prototype
✅ USE the tool when:
- User asks to "create", "build", "make", "generate" a prototype
- User asks to "change", "modify", "update", "fix" the prototype
- User asks for specific feature additions ("add a slider", "show a chart")
- The initial message contains paper content (first prototype generation)
- There's an error that needs fixing

❌ DO NOT use the tool when:
- User says "hi", "hey", "hello", "thanks"
- User asks a question ("what is this?", "how does it work?")
- User wants explanation without changes
- User is just chatting

## CONVERSATION STYLE
- Be friendly and concise
- For simple greetings, just respond naturally
- For questions, explain clearly without regenerating the prototype
- Only call render_prototype when actual changes are needed

## WHAT MAKES A GREAT PROTOTYPE
- **Interactive**: Users can adjust parameters and see results change in real-time
- **Educational**: Shows the algorithm step-by-step, not just final output
- **Accurate**: Implements the REAL math/algorithm from the paper
- **Visual**: Uses charts, animations, or diagrams to make concepts clear

## TECHNICAL REQUIREMENTS

### Code Structure (MUST follow this exactly)
\`\`\`jsx
import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sliders } from 'lucide-react';

// Helper functions for the algorithm
function calculateSomething(params) {
  // Real implementation
  return result;
}

export default function App() {
  // State with INITIALIZED values (CRITICAL!)
  const [param1, setParam1] = useState(0.5);
  const [data, setData] = useState([]);
  
  // Compute results
  const results = useMemo(() => {
    return calculateSomething(param1);
  }, [param1]);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">Concept Name</h1>
      
      {/* Controls */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
        <label>Parameter: {param1}</label>
        <input type="range" min="0" max="1" step="0.01" 
               value={param1} onChange={e => setParam1(Number(e.target.value))} />
      </div>
      
      {/* Visualization */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        {/* Charts, animations, etc */}
      </div>
    </div>
  );
}
\`\`\`

### Available Libraries
- **React 18**: useState, useEffect, useMemo, useCallback, useRef
- **Recharts**: LineChart, AreaChart, BarChart, ScatterChart, PieChart, ComposedChart, ResponsiveContainer
- **Framer Motion**: motion, AnimatePresence (for animations)
- **Lucide React**: Icons (Play, Pause, Settings, Brain, Zap, ChevronRight, etc.)
- **clsx**: Conditional class names

### CRITICAL RULES (Breaking these causes errors!)
✅ **MUST DO**:
- \`import React, { useState } from 'react'\` - ES Module imports
- \`export default function App()\` - Named export
- \`useState(initialValue)\` - ALWAYS provide initial value
- \`(array || []).map()\` or \`array?.map()\` - Check arrays before mapping
- Use Tailwind CSS for all styling

❌ **NEVER DO**:
- \`$x$\` or \`\\frac{}\` - No LaTeX! Use Unicode: × ÷ √ ² ³ ∑ ∫ π θ α β
- \`require()\` - Only ES Module imports
- \`useState()\` without initial value - Will crash!
- SVG path with percentage values - Use absolute numbers

## ERROR HANDLING
When you receive an error from a failed render:
1. Read the error message carefully
2. Fix ONLY the specific issue mentioned
3. Don't rewrite the entire component
4. Common fixes:
   - "X is not defined" → Add the import
   - "Cannot read property of undefined" → Add \`?.\` or \`|| default\`
   - "Invalid hook call" → Move hooks to top level of component

## UI DESIGN
- **Background**: bg-gray-950 (main), bg-gray-900 (sections)
- **Cards**: bg-gray-800/50 rounded-xl border border-white/10 p-4
- **Text**: text-white (primary), text-gray-400 (secondary)
- **Accents**: blue-500 (primary), emerald-500 (success), purple-500 (highlight)
- **Animations**: Use framer-motion for smooth transitions

## CONVERSATION STYLE
- Be concise - let the prototype speak for itself
- When modifying, make targeted changes
- Explain what the prototype PROVES about the paper's claims`;

// ============================================================================
// TOOL DEFINITION
// ============================================================================

const agentTools = {
  functionDeclarations: [
    {
      name: "render_prototype",
      description: `Renders an interactive React prototype in the sandbox. Call this to display your implementation of the paper's concept.

The prototype should:
- Implement the actual algorithm/equation from the paper
- Be interactive (sliders, buttons, inputs)
- Show real calculations, not fake data
- Help users understand and validate the paper's claims`,
      parameters: {
        type: Type.OBJECT,
        properties: {
          code: {
            type: Type.STRING,
            description: `Complete React component code. MUST include:
- ES Module imports (import React from 'react')
- export default function App()
- All useState calls with initial values
- Tailwind CSS for styling`,
          },
          title: {
            type: Type.STRING,
            description: "Short descriptive title for this prototype",
          },
        },
        required: ["code"],
      },
    },
  ],
};






// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, isInitial } = body;

    // Use history directly - page already formats it correctly
    const contents = history || [];

    console.log(`[Agent] Calling Gemini with ${contents.length} messages, isInitial: ${isInitial}`);

    // Retry logic for overloaded model
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
    
    let response;
    let lastError;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        response = await ai.models.generateContentStream({
          model: "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction: systemInstruction,
            tools: [agentTools],
          },
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        const isOverloaded = error?.status === 503 || 
                            error?.message?.includes('overloaded') ||
                            error?.message?.includes('503');
        
        if (isOverloaded && attempt < MAX_RETRIES - 1) {
          console.log(`[Agent] Model overloaded, retrying in ${RETRY_DELAYS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        } else {
          throw error;
        }
      }
    }
    
    if (!response) {
      throw lastError || new Error('Failed to get response from Gemini');
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Track if we've already sent a function call for this response
          let functionCallSent = false;
          
          for await (const chunk of response) {
            // Extract text content - try multiple approaches
            let text = "";
            try {
              // Method 1: Direct text property (function)
              if (typeof (chunk as any).text === "function") {
                text = (chunk as any).text();
              }
              // Method 2: Direct text property (string)
              else if (typeof chunk.text === "string") {
                text = chunk.text;
              }
              // Method 3: From candidates parts
              else {
                const textPart = chunk.candidates?.[0]?.content?.parts?.find(
                  (p: any) => typeof p.text === "string"
                );
                text = textPart?.text || "";
              }
            } catch {
              // Ignore text extraction errors
            }

            // Send text chunks (only if non-empty)
            if (text && text.trim()) {
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: "text", content: text }) + "\n")
              );
            }

            // Check for function calls - only send once per response
            if (!functionCallSent) {
              // Check in candidates parts (primary method)
              const parts = chunk.candidates?.[0]?.content?.parts;
              if (parts) {
                for (const part of parts) {
                  if ((part as any).functionCall) {
                    const functionCall = (part as any).functionCall;
                    console.log("[Agent] Function call:", functionCall.name);
                    
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "tool_call",
                          name: functionCall.name,
                          args: functionCall.args,
                          title: functionCall.args?.title,
                        }) + "\n"
                      )
                    );
                    functionCallSent = true;
                    break;
                  }
                }
              }
              
              // Fallback: check chunk.functionCalls (older SDK versions)
              if (!functionCallSent) {
                const functionCalls = (chunk as any).functionCalls;
                if (functionCalls && Array.isArray(functionCalls) && functionCalls.length > 0) {
                  const call = functionCalls[0]; // Take first one only
                  console.log("[Agent] Function call (fallback):", call.name);
                  
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: "tool_call",
                        name: call.name,
                        args: call.args,
                        title: call.args?.title,
                      }) + "\n"
                    )
                  );
                  functionCallSent = true;
                }
              }
            }
          }

          // Signal completion
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "done" }) + "\n")
          );
          controller.close();
        } catch (error) {
          console.error("[Agent] Stream error:", error);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "error", message: String(error) }) + "\n"
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[Agent] Error:", error);
    
    // Check if it's an overload error
    const isOverloaded = error?.status === 503 || 
                        error?.message?.includes('overloaded') ||
                        error?.message?.includes('503');
    
    if (isOverloaded) {
      // Return a streaming response with error so frontend handles it properly
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(JSON.stringify({ 
              type: "error", 
              message: "Model is overloaded. Please try again in a few seconds.",
              retryable: true
            }) + "\n")
          );
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done" }) + "\n"));
          controller.close();
        }
      });
      
      return new NextResponse(errorStream, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-cache",
        },
      });
    }
    
    return NextResponse.json(
      { error: "Agent failed", details: String(error) },
      { status: 500 }
    );
  }
}
