import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// ============================================================================
// SYSTEM INSTRUCTION - Smart agent for proving research paper concepts
// ============================================================================

const systemInstruction = `You are SciProto AI, an expert at transforming research papers into WORKING PROTOTYPES that PROVE the paper's ideas actually work.

## YOUR MISSION
You don't just visualize papers - you IMPLEMENT their core algorithms and let users VALIDATE the claims. Every prototype should answer: "Does this theory actually work?"

## WORKFLOW
1. **Understand** the paper's core concept/algorithm
2. **Plan** how to make it interactive (what parameters can users adjust?)
3. **Implement** the actual algorithm with real calculations
4. **Call render_prototype** with your complete code

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
    const { history, message, functionResponse, paperContext, useThinking } = body;

    // Build conversation contents
    let contents = history || [];
    const isFirstMessage = contents.length === 0;

    // Add paper context as initial context if provided and this is the first message
    if (paperContext && isFirstMessage) {
      // Truncate very long papers but keep the important parts
      const truncatedContext = paperContext.length > 40000 
        ? paperContext.slice(0, 35000) + "\n\n[... paper truncated for length ...]"
        : paperContext;
        
      contents.push({
        role: "user",
        parts: [{ text: `PAPER TEXT:\n\n${truncatedContext}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "I've analyzed the paper. I'll create an interactive prototype that PROVES its core concepts work. What aspect would you like me to implement?" }],
      });
    }

    // Append new user message
    if (message) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // Append function/tool response with enhanced feedback
    if (functionResponse) {
      const response = functionResponse.response;
      
      // If it was an error, add helpful context for the model
      if (response && !response.success && response.error) {
        const enhancedResponse = {
          ...response,
          hint: "Fix the specific error and re-render. Don't rewrite everything - make targeted fixes.",
        };
        contents.push({
          role: "tool",
          parts: [
            {
              functionResponse: {
                name: functionResponse.name,
                response: enhancedResponse,
              },
            },
          ],
        });
      } else {
        contents.push({
          role: "tool",
          parts: [
            {
              functionResponse: {
                name: functionResponse.name,
                response: functionResponse.response,
              },
            },
          ],
        });
      }
    }

    console.log(`[Agent] Calling Gemini, contents: ${contents.length} messages`);

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
          for await (const chunk of response) {
            // Extract text content
            let text = "";
            try {
              if (typeof chunk.text === "string") {
                text = chunk.text;
              } else if (typeof (chunk as any).text === "function") {
                text = (chunk as any).text();
              } else {
                text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }
            } catch {
              // Ignore text extraction errors
            }

            // Send text chunks
            if (text) {
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: "text", content: text }) + "\n")
              );
            }

            // Check for function calls in candidates
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
                }
              }
            }

            // Also check for functionCalls at chunk level (legacy format)
            const functionCalls = (chunk as any).functionCalls;
            if (functionCalls && Array.isArray(functionCalls)) {
              for (const call of functionCalls) {
                console.log("[Agent] Function call (legacy):", call.name);
                
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
