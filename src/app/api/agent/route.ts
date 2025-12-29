import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

//// System instruction to guide the agent
const systemInstruction = `You are an expert React Prototyper.
Your goal is to create interactive, educational physics/scientific simulations using React.

You have access to a tool called "render_prototype".
WHEN you are asked to create a prototype:
1.  Design a high-quality, interactive React component.
2.  IMMEDIATELY call the 'render_prototype' tool with the code.

DO NOT write the code in markdown first. Call the tool directly.
You can provide a very brief summary of what you are building before the tool call, but keep it minimal.

Technical Stack:
- React 18 (Hooks)
- Recharts 2.12
- Tailwind CSS
- Lucide React

CRITICAL RULES:
- NO LaTeX raw syntax (e.g. $E=mc^2$) in text nodes. It breaks React. Use plain text "E=mc^2" or unicode.
- NO Percentage values in SVG path 'd' attributes.
- ALWAYS use 'import' statements for dependencies. The environment is a native Browser Native ES Module environment with Import Maps.
- DEFENSIVE CODING: Always check if arrays exist before mapping (e.g. \`data && data.map\`). Initialize state with valid defaults.
`;

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
                // Determine text content
                if (typeof (chunk as any).text === 'function') {
                    text = (chunk as any).text();
                } else if (typeof (chunk as any).text === 'string') {
                    text = (chunk as any).text;
                } else {
                    text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
                }
                // console.log("Server Stream Chunk Text:", text ? text.substring(0, 50) + "..." : "[No Text]");
            } catch (e) {
                console.error("Server Text Extraction Error:", e);
            }

            if (text) {
               // console.log("Enqueueing text to client:", text.length);
               controller.enqueue(encoder.encode(JSON.stringify({ type: "text", content: text }) + "\n"));
            }
            
            // Check for function calls
            const candidates = (chunk as any).candidates;
            const parts = candidates?.[0]?.content?.parts;

            if (parts) {
                 const toolParts = parts.filter((p: any) => p.functionCall);
                 if (toolParts.length > 0) {
                     console.log("Server Found Tool Call Part:", toolParts[0].functionCall.name);
                     const fullPart = toolParts[0];
                     controller.enqueue(encoder.encode(JSON.stringify({ type: "tool_call_part", part: fullPart }) + "\n"));
                 }
            } else {
                 let toolCalls;
                 if (typeof (chunk as any).functionCalls === 'function') {
                     toolCalls = (chunk as any).functionCalls();
                 }

                 if (toolCalls && toolCalls.length > 0) {
                     console.log("Server Found Tool Call (Legacy):", toolCalls[0].name);
                     const call = toolCalls[0];
                     const part = { functionCall: call };
                     controller.enqueue(encoder.encode(JSON.stringify({ type: "tool_call_part", part: part }) + "\n"));
                 }
            }
          }
          console.log("Server Stream Completed");
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
