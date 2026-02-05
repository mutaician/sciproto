import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

// ============================================================================
// ENHANCED PAPER ANALYSIS SCHEMA
// ============================================================================

// Zod schema for type validation and TypeScript types
const TestableHypothesisSchema = z.object({
  hypothesis: z.string().describe("A specific, testable claim from the paper"),
  how_to_test: z.string().describe("How this could be validated in a prototype"),
  expected_outcome: z.string().describe("What result would confirm the hypothesis"),
});

const KeyEquationSchema = z.object({
  name: z.string().describe("Name or identifier for the equation"),
  latex: z.string().describe("The equation in plain text (no LaTeX delimiters)"),
  description: z.string().describe("What this equation represents"),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    typical_range: z.string().optional(),
  })).describe("Variables in the equation that could be adjusted"),
});

const SimulationPossibilitySchema = z.object({
  title: z.string().describe("Title of the potential simulation"),
  description: z.string().describe("Description of what the user would interact with"),
  complexity: z.enum(["Low", "Medium", "High"]).describe("Estimated development complexity"),
  variables: z.array(z.string()).describe("List of adjustable parameters"),
  expected_insights: z.string().describe("What users will learn from this simulation"),
  visualization_type: z.enum(["chart", "animation", "interactive", "3d", "diagram"]).describe("Best visualization approach"),
});

const PaperAnalysisSchema = z.object({
  // Basic Info
  title: z.string().describe("The title of the research paper"),
  authors: z.array(z.string()).describe("List of author names if available"),
  publication_year: z.string().optional().describe("Year of publication if mentioned"),
  
  // Summary & Impact
  summary: z.string().describe("A clear, accessible summary of the paper (2-3 sentences)"),
  breakthrough_score: z.number().min(1).max(100).describe("Score 1-100 indicating how novel/impactful this paper could be"),
  breakthrough_reasoning: z.string().describe("Brief explanation of why this score was given"),
  
  // Core Content
  key_claims: z.array(z.string()).describe("List of 3-5 key scientific claims made in the paper"),
  testable_hypotheses: z.array(TestableHypothesisSchema).describe("Specific hypotheses that can be validated"),
  key_equations: z.array(KeyEquationSchema).describe("Important equations or algorithms from the paper"),
  
  // Prototype Suggestions
  simulation_possibilities: z.array(SimulationPossibilitySchema).describe("Interactive simulations that could be built"),
  
  // Context
  field: z.string().describe("Primary research field (e.g., Machine Learning, Physics, Biology)"),
  related_fields: z.array(z.string()).describe("Other fields this research connects to"),
  limitations: z.array(z.string()).describe("Limitations or caveats mentioned in the paper"),
  
  // Practical
  difficulty_to_understand: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).describe("How accessible is this paper"),
  prerequisites: z.array(z.string()).describe("Knowledge needed to understand this paper"),
});

export type PaperAnalysis = z.infer<typeof PaperAnalysisSchema>;
export type TestableHypothesis = z.infer<typeof TestableHypothesisSchema>;
export type KeyEquation = z.infer<typeof KeyEquationSchema>;
export type SimulationPossibility = z.infer<typeof SimulationPossibilitySchema>;

// ============================================================================
// GEMINI API SCHEMA (Manual definition for API compatibility)
// ============================================================================

const responseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    authors: { type: "ARRAY", items: { type: "STRING" } },
    publication_year: { type: "STRING" },
    summary: { type: "STRING" },
    breakthrough_score: { type: "NUMBER" },
    breakthrough_reasoning: { type: "STRING" },
    key_claims: { type: "ARRAY", items: { type: "STRING" } },
    testable_hypotheses: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hypothesis: { type: "STRING" },
          how_to_test: { type: "STRING" },
          expected_outcome: { type: "STRING" },
        },
        required: ["hypothesis", "how_to_test", "expected_outcome"],
      },
    },
    key_equations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          latex: { type: "STRING" },
          description: { type: "STRING" },
          variables: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                description: { type: "STRING" },
                typical_range: { type: "STRING" },
              },
              required: ["name", "description"],
            },
          },
        },
        required: ["name", "latex", "description", "variables"],
      },
    },
    simulation_possibilities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          description: { type: "STRING" },
          complexity: { type: "STRING", enum: ["Low", "Medium", "High"] },
          variables: { type: "ARRAY", items: { type: "STRING" } },
          expected_insights: { type: "STRING" },
          visualization_type: { type: "STRING", enum: ["chart", "animation", "interactive", "3d", "diagram"] },
        },
        required: ["title", "description", "complexity", "variables", "expected_insights", "visualization_type"],
      },
    },
    field: { type: "STRING" },
    related_fields: { type: "ARRAY", items: { type: "STRING" } },
    limitations: { type: "ARRAY", items: { type: "STRING" } },
    difficulty_to_understand: { type: "STRING", enum: ["Beginner", "Intermediate", "Advanced", "Expert"] },
    prerequisites: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "title", "authors", "summary", "breakthrough_score", "breakthrough_reasoning",
    "key_claims", "testable_hypotheses", "key_equations", "simulation_possibilities",
    "field", "related_fields", "limitations", "difficulty_to_understand", "prerequisites"
  ],
};

// ============================================================================
// ANALYSIS PROMPT
// ============================================================================

const ANALYSIS_SYSTEM_PROMPT = `You are SciProto AI, an expert Scientific Researcher and Prototype Architect.

Your mission is to analyze research papers and identify opportunities to turn theoretical concepts into WORKING INTERACTIVE PROTOTYPES that prove the paper's ideas actually work.

## Your Analysis Goals:

1. **UNDERSTAND** the paper's core contribution and novelty
2. **IDENTIFY** testable claims that can be validated through simulation
3. **EXTRACT** key equations/algorithms that have adjustable parameters
4. **PROPOSE** interactive prototypes that would demonstrate the paper's ideas
5. **SCORE** the breakthrough potential (how novel and impactful is this?)

## Breakthrough Scoring Guidelines (1-100):
- 90-100: Revolutionary (like "Attention Is All You Need" - paradigm shifting)
- 70-89: Significant advancement (major improvement over existing methods)
- 50-69: Solid contribution (useful but incremental)
- 30-49: Minor contribution (small improvements or applications)
- 1-29: Limited novelty (mostly review or minor variations)

## For Simulation Possibilities:
Focus on concepts that can be VISUALIZED and INTERACTED with:
- Equations with tunable parameters → sliders that show real-time effects
- Algorithms with steps → step-by-step visualizations
- Comparisons → side-by-side demonstrations
- Data transformations → before/after visualizations

## Important:
- Be specific and actionable in your suggestions
- Focus on what would be IMPRESSIVE and EDUCATIONAL to demonstrate
- Consider what would make someone say "wow, I finally understand this!"
- For equations, use plain text notation (no LaTeX delimiters like $ or \\)`;

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function analyzePaper(paperText: string): Promise<PaperAnalysis> {
  const userPrompt = `Analyze this research paper and provide a comprehensive breakdown:

---
PAPER TEXT:
${paperText.slice(0, 50000)}
---

Provide your analysis following the schema. Be thorough but concise.
For breakthrough_score, carefully consider how novel and impactful this work is compared to existing research.
For simulation_possibilities, focus on the most impressive and educational demonstrations possible.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: userPrompt,
      config: {
        systemInstruction: ANALYSIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text || "{}";
    
    // Parse and validate
    let json = JSON.parse(text);
    if (Array.isArray(json)) json = json[0];

    // Ensure arrays exist
    json.authors = json.authors || [];
    json.key_claims = json.key_claims || [];
    json.testable_hypotheses = json.testable_hypotheses || [];
    json.key_equations = json.key_equations || [];
    json.simulation_possibilities = json.simulation_possibilities || [];
    json.related_fields = json.related_fields || [];
    json.limitations = json.limitations || [];
    json.prerequisites = json.prerequisites || [];

    // Validate with Zod
    return PaperAnalysisSchema.parse(json);
  } catch (error) {
    console.error("Failed to analyze paper:", error);
    throw new Error("Failed to analyze paper. Please try again.");
  }
}

// ============================================================================
// QUICK ANALYSIS (Faster, less detailed - for browsing)
// ============================================================================

const quickAnalysisSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    breakthrough_score: { type: "NUMBER" },
    field: { type: "STRING" },
    key_insight: { type: "STRING" },
  },
  required: ["title", "summary", "breakthrough_score", "field", "key_insight"],
};

export interface QuickAnalysis {
  title: string;
  summary: string;
  breakthrough_score: number;
  field: string;
  key_insight: string;
}

export async function quickAnalyzePaper(paperText: string): Promise<QuickAnalysis> {
  const prompt = `Quickly analyze this paper and provide:
1. Title
2. One-sentence summary
3. Breakthrough score (1-100)
4. Primary field
5. The single most important insight

Paper (first 5000 chars):
${paperText.slice(0, 5000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quickAnalysisSchema,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Quick analysis failed:", error);
    throw new Error("Quick analysis failed");
  }
}
