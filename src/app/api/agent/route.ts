import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// ============================================================================
// SYSTEM INSTRUCTION - Enhanced for better prototype generation
// ============================================================================

const systemInstruction = `You are SciProto AI, an expert at transforming research paper concepts into interactive, educational prototypes.

## Your Mission
Create stunning, interactive React components that PROVE research paper concepts work. Your prototypes should make complex ideas accessible and let users experiment with the underlying theory.

## When Asked to Create a Prototype:
1. **THINK** briefly about the best way to visualize the concept
2. **IMMEDIATELY** call the 'render_prototype' tool with your code
3. Keep explanations minimal - let the prototype speak for itself

## Technical Stack (Available via ES Module imports):
- React 18 (Hooks: useState, useEffect, useMemo, useCallback)
- Recharts 2.12 (LineChart, AreaChart, BarChart, ScatterChart, etc.)
- Tailwind CSS (all utility classes)
- Lucide React (icons)
- Framer Motion (animations)
- clsx (conditional classes)

## Code Quality Standards:
\`\`\`
✅ DO:
- Use 'import' statements (e.g., import React, { useState } from 'react')
- Export default function App() { ... }
- Initialize state with valid defaults
- Use Tailwind for all styling
- Add helpful labels and explanations in the UI
- Make it interactive with sliders, buttons, inputs
- Use smooth animations for state changes
- Handle edge cases gracefully

❌ DON'T:
- Use LaTeX syntax ($x$, \\frac{}) in JSX text - use plain text or Unicode
- Use percentage values in SVG path 'd' attributes
- Leave arrays unchecked before mapping
- Create components that crash on initial render
- Use require() - only ES Module imports
\`\`\`

## Visualization Best Practices:
- **Equations**: Show the formula, then visualize its output with adjustable parameters
- **Algorithms**: Step-by-step visualization with play/pause controls
- **Comparisons**: Side-by-side views with synchronized controls
- **Data flows**: Animated diagrams showing transformations
- **Neural networks**: Layer visualizations with activations

## UI Design Guidelines:
- Dark theme (bg-gray-900, text-white)
- Accent colors: blue-500, emerald-500, purple-500
- Rounded corners (rounded-xl)
- Subtle borders (border-white/10)
- Glass effects (bg-white/5 backdrop-blur)
- Smooth transitions (transition-all duration-300)

Remember: Your goal is to make someone say "Wow, I finally understand this concept!"`;

// ============================================================================
// TOOL DEFINITION - render_prototype
// ============================================================================

const renderPrototypeTool = {
  functionDeclarations: [
    {
      name: "render_prototype",
      description: "Renders a React component in the interactive sandbox. Call this to display your prototype.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          code: {
            type: Type.STRING,
            description: `The complete React functional component code. Requirements:
- Must use ES Module imports (import React from 'react')
- Must export default function App()
- Use Tailwind CSS for styling
- Available libraries: react, recharts, lucide-react, framer-motion, clsx
- No LaTeX in text, no SVG percentage values
- Initialize all state with valid defaults`,
          },
          title: {
            type: Type.STRING,
            description: "A short title for this prototype version",
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
    const { history, message, functionResponse, paperContext } = body;

    // Build conversation contents
    let contents = history || [];

    // Add paper context as initial context if provided and this is the first message
    if (paperContext && contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: `Here is the research paper context for reference:\n\n${paperContext.slice(0, 30000)}` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "I've reviewed the paper. I'm ready to create interactive prototypes based on its concepts. What would you like me to build?" }],
      });
    }

    // Append new user message
    if (message) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // Append function/tool response
    if (functionResponse) {
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

    // Call Gemini with streaming
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: systemInstruction,
        tools: [renderPrototypeTool],
      },
    });

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
  } catch (error) {
    console.error("[Agent] Error:", error);
    return NextResponse.json(
      { error: "Agent failed", details: String(error) },
      { status: 500 }
    );
  }
}
