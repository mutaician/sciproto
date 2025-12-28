import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

// Define the schema using Zod specifically for Validation (PaperAnalysis type)
const PaperAnalysisSchema = z.object({
  title: z.string().describe("The title of the research paper"),
  summary: z.string().describe("A brief executive summary of the paper (max 3 sentences)"),
  key_claims: z.array(z.string()).describe("List of 3-5 key scientific claims made in the paper"),
  simulation_possibilities: z.array(z.object({
    title: z.string().describe("Title of the potential simulation"),
    description: z.string().describe("Description of what the user would interact with"),
    complexity: z.enum(["Low", "Medium", "High"]).describe("Estimated development complexity"),
    variables: z.array(z.string()).describe("List of adjustable parameters")
  })).describe("List of interactive simulations that could be built based on this paper")
});

export type PaperAnalysis = z.infer<typeof PaperAnalysisSchema>;

// Define the schema manually to ensure strict compatibility with Gemini API
const responseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    key_claims: { 
      type: "ARRAY", 
      items: { type: "STRING" } 
    },
    simulation_possibilities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          complexity: { type: "STRING", enum: ["Low", "Medium", "High"] },
          variables: { 
            type: "ARRAY", 
            items: { type: "STRING" } 
          }
        },
        required: ["title", "description", "complexity", "variables"]
      }
    }
  },
  required: ["title", "summary", "key_claims", "simulation_possibilities"]
};

export async function analyzePaper(paperText: string): Promise<PaperAnalysis> {
  const prompt = `
  You are an expert Scientific Researcher and Prototype Architect.
  Analyze the following research paper text.
  
  Your goal is to identify the core scientific concepts that can be turned into an INTERACTIVE PROTOTYPE or SIMULATION.
  Focus on equations, algorithms, or systems that have adjustable parameters.
  
  Paper Text:
  ${paperText.slice(0, 30000)}
  `;

  // Using gemini-3-flash-preview with a clean schema config.
  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { role: "user", parts: [{ text: prompt }] },
    config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
    }
  });

  const text = response.text || "{}";
  try {
      // Use standard JSON parse and the Zod schema for type validation only
      let json = JSON.parse(text);
      if (Array.isArray(json)) json = json[0]; 
      
      // Robustness: Ensure simulation_possibilities is an array
      if (!Array.isArray(json.simulation_possibilities)) {
          json.simulation_possibilities = [];
      }

      return PaperAnalysisSchema.parse(json);
  } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      // console.log("Raw response:", text);
      throw new Error("Failed to parse analysis results");
  }
}
