import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Model configuration - optimizing for long context and reasoning
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export interface PaperAnalysis {
  title: string;
  summary: string;
  key_claims: string[];
  simulation_possibilities: Array<{
    title: string;
    description: string;
    complexity: "Low" | "Medium" | "High";
    variables: string[];
  }>;
}

export async function analyzePaper(paperText: string): Promise<PaperAnalysis> {
  const prompt = `
  You are an expert Scientific Researcher and Prototype Architect.
  Analyze the following research paper text.
  
  Your goal is to identify the core scientific concepts that can be turned into an INTERACTIVE PROTOTYPE or SIMULATION.
  Focus on equations, algorithms, or systems that have adjustable parameters.
  
  Return a valid JSON object with the following schema:
  {
    "title": "Paper Title",
    "summary": "Brief executive summary (max 3 sentences)",
    "key_claims": ["Claim 1", "Claim 2"],
    "simulation_possibilities": [
      {
        "title": "Name of the simulation",
        "description": "What will the user interact with? What happens when they change parameters?",
        "complexity": "Low" | "Medium" | "High",
        "variables": ["List of adjustable parameters, e.g., 'Learning Rate', 'Number of Layers', 'Voltage'"]
      }
    ]
  }

  Paper Text:
  ${paperText.slice(0, 100000)} // Truncate to avoid massive overload if text is huge, though Gemini can handle it.
  `;

  // We request JSON format.
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" }
  });

  const text = result.response.text();
  return JSON.parse(text) as PaperAnalysis;
}

export async function generatePrototypeCode(simulationPlan: any): Promise<string> {
  // Logic to generate React code will go here
  return "// Code generation placeholder";
}
