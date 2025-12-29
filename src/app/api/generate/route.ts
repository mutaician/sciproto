import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

export async function POST(req: NextRequest) {
  try {
    const { analysis, simulation } = await req.json();

    const prompt = `
    You are an expert React Developer and Scientific Visualization Engineer.
    Your task is to create a SINGLE REUSABLE REACT COMPONENT that implements the following simulation:

    Simulation Title: ${simulation.title}
    Description: ${simulation.description}
    Adjustable Variables: ${simulation.variables.join(", ")}
    Key Claims Supported: ${analysis.key_claims.join("; ")}

    REQUIREMENTS:
    1.  Return ONLY the React Component code. NO markdown, NO code blocks, NO explainer text. Just the code.
    2.  Use functional components with Hooks.
    3.  Use 'recharts' for any plotting (LineChart, ScatterChart, etc.). 
        - Assume 'recharts' acts as a global namespace or that you can use the object destructuring pattern: 
        - 'const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;' if you need it, BUT better to assume global 'Recharts' object is available if running in browser script tag, OR just rely on standard imports if using a bundler. 
        - SINCE THIS RUNS IN A SANDBOX WITH CDN: 
        - DO NOT import recharts. Assume 'Recharts' is a global variable.
        - Example: '<Recharts.LineChart ... >'
    4.  Use Tailwind CSS for styling. The parent container has 'p-6 bg-white/5 rounded-xl border border-white/10'.
    5.  Make it interactive. Add sliders/inputs for the variables.
    6.  The component should be default export.

    IMPORTANT:
    The environment is a standalone Babel-transpiled script in the browser.
    - React and ReactDOM are available as globals.
    - Recharts is available as 'window.Recharts'.
    - DO NOT use 'import' statements. Use 'const { useState, useEffect } = React;'
    - Use 'const { LineChart, ... } = Recharts;' at the top.
    
    Start the code with:
    'const Simulation = () => {'
    End with:
    'export default Simulation;'
    `;

    const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { role: "user", parts: [{ text: prompt }] }
    });

    let code = response.text || "";
    
    // Cleanup markdown if present
    code = code.replace(/```javascript/g, "").replace(/```jsx/g, "").replace(/```/g, "");

    return NextResponse.json({ code });
  } catch (error) {
    console.error("Code Gen Error:", error);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}
