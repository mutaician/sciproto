import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
// Use the strong model for code gen
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export async function POST(req: NextRequest) {
  try {
    const { simulationTitle, simulationDescription } = await req.json();

    const prompt = `
    You are a React Specialist and Scientific Visualization Expert.
    Create a React Component named 'Simulation' that visualizes the following concept:
    
    Title: ${simulationTitle}
    Description: ${simulationDescription}
    
    Requirements:
    1. Use 'Recharts' for plotting if data needs to be shown (LineChart, AreaChart, etc.). 
       The library is available as a global variable 'Recharts'.
       Destructured available: LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer.
    2. Use 'React' hooks (useState, useEffect) for state. Available globally.
    3. The component MUST be named 'Simulation'.
    4. Provide interactive controls (sliders, inputs) for parameters.
    5. Style using Tailwind CSS classes.
    6. Return ONLY the code for the component function and any helper functions.
       DO NOT include imports.
       DO NOT include 'export default'.
       DO NOT include markdown backticks.
    
    Example Structure:
    
    const Simulation = () => {
       const [val, setVal] = useState(0);
       // ... logic
       return (
         <div className="p-4 bg-gray-900 rounded-lg text-white">
            <h2 className="text-xl mb-4">${simulationTitle}</h2>
            {/* Controls */}
            {/* Charts */}
         </div>
       )
    };
    `;

    const result = await model.generateContent(prompt);
    let code = result.response.text();

    // Cleanup code
    code = code.replace(/```jsx/g, "").replace(/```javascript/g, "").replace(/```/g, "");
    
    return NextResponse.json({ code });
  } catch (error) {
    console.error("Code Gen Error:", error);
    return NextResponse.json({ error: "Failed to generate code" }, { status: 500 });
  }
}
