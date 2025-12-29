import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

// Tool definition schema
const renderPrototypeTool: any = {
  functionDeclarations: [
    {
      name: "render_prototype",
      description: "Renders the React component code in the interactive sandbox.",
      parameters: {
        type: "OBJECT",
        properties: {
          code: {
            type: "STRING",
            description: "The full React Functional Component code for App.tsx. Use standard ES Modules 'import' syntax (e.g., import React from 'react'; import { LineChart } from 'recharts'). MUST 'export default function App()'. Use Tailwind for styling. Recharts, Lucide-React, Framer-Motion are available via valid imports. IMPORTANT: No LaTeX text ($x$), no SVG percentages.",
          },
        },
        required: ["code"],
      },
    },
  ],
};

const systemInstruction = `
You are an expert "Vibe Engineering" Agent for Scientific Prototypes.
Your Goal: Create beautiful, interactive, and CORRECT scientific simulations using React.

Work Style:
1. **Iterative**: You don't just write code once. You wait for feedback.
2. **Self-Correcting**: If the user or the tool reports an error (Runtime Error, Syntax Error), you MUST analyze it and IMMEDIATELY call 'render_prototype' again with the FIXED code. Do not ask for permission to fix bugs.
3. **Visuals**: Use 'recharts' for data visualization. Use 'framer-motion' for slick animations. Use Tailwind for "glassmorphism" (bg-white/10, backdrop-blur).

Technical Stack:
- React 18 (Hooks)
- Recharts 2.12 (ResponsiveContainer is mandatory for sizing)
- Tailwind CSS (Standard)
- Lucide React (Icons)

CRITICAL RULES:
- NO LaTeX raw syntax (e.g. $E=mc^2$) in text nodes. It breaks React. Use plain text "E=mc^2" or unicode.
- NO Percentage values in SVG path 'd' attributes.
- ALWAYS use 'import' statements for dependencies. The environment is a native Browser Native ES Module environment with Import Maps.
- DEFENSIVE CODING: Always check if arrays exist before mapping (e.g. \`data && data.map\`). Initialize state with valid defaults.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { history, message, functionResponse } = body;

    // Construct conversation history
    let contents = history || [];

    // Append new user message
    if (message) {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // Append function response
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

    const model = "gemini-3-flash-preview";

    const result = await genAI.models.generateContentStream({
      model,
      contents,
      systemInstruction: systemInstruction,
      config: {
        tools: [renderPrototypeTool],
      },
    });

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const streamSource = (result as any).stream || result;
          
          for await (const chunk of streamSource) {
            let text = "";
            try {
                if (typeof (chunk as any).text === 'function') {
                    text = (chunk as any).text();
                } else if (typeof (chunk as any).text === 'string') {
                    text = (chunk as any).text;
                } else {
                    text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                }
            } catch (e) {
                // Ignore text extraction errors (e.g. tool calls)
            }

            if (text) {
               controller.enqueue(encoder.encode(JSON.stringify({ type: "text", content: text }) + "\n"));
            }
            
            // Check for function calls
            // In @google/genai, we usually check chunk.functionCalls() method or candidates
            const candidates = (chunk as any).candidates;
            const parts = candidates?.[0]?.content?.parts;

            if (parts) {
                 // Filter for function calls
                 const toolParts = parts.filter((p: any) => p.functionCall);
                 if (toolParts.length > 0) {
                     // Send the WHOLE part object to the client to preserve 'thought_signature' or other metadata
                     const fullPart = toolParts[0];
                     controller.enqueue(encoder.encode(JSON.stringify({ type: "tool_call_part", part: fullPart }) + "\n"));
                 }
            } else {
                 // Fallback for older SDK versions or simple chunks
                let toolCalls;
                if (typeof (chunk as any).functionCalls === 'function') {
                    toolCalls = (chunk as any).functionCalls();
                }

                if (toolCalls && toolCalls.length > 0) {
                    const call = toolCalls[0];
                    // Wrap in a synthetic part if we only got the call
                    const part = { functionCall: call };
                    controller.enqueue(encoder.encode(JSON.stringify({ type: "tool_call_part", part: part }) + "\n"));
                }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
        headers: { "Content-Type": "application/x-ndjson" }
    });

  } catch (error) {
    console.error("Agent Error:", error);
    return NextResponse.json({ error: "Agent failed" }, { status: 500 });
  }
}
