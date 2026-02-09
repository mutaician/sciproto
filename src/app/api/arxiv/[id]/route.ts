import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPaper, fetchArxivPdfText } from "@/lib/arxiv";
import { analyzePaper } from "@/lib/gemini";
import { getAnalysis, saveAnalysis } from "@/lib/db";

/**
 * GET /api/arxiv/[id]
 * 
 * Fetch a specific arXiv paper by ID
 * 
 * Query params:
 * - analyze: If "true", fetch PDF, extract text, and analyze
 * - text: If "true", also fetch and extract PDF text
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const shouldAnalyze = searchParams.get("analyze") === "true";
    const includeText = searchParams.get("text") === "true";
    
    console.log(`[API /arxiv/${id}] Fetching paper, analyze=${shouldAnalyze}, text=${includeText}`);
    
    // Fetch paper metadata
    const paper = await fetchArxivPaper(id);
    
    if (!paper) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      );
    }
    
    // If analysis requested, check cache first then analyze
    if (shouldAnalyze) {
      // Use arXiv ID as hash for caching
      const cacheKey = `arxiv-${id.replace(/[^a-zA-Z0-9]/g, "-")}`;
      
      // Check cache
      const cached = getAnalysis(cacheKey);
      if (cached) {
        console.log(`[API /arxiv/${id}] Cache hit`);
        return NextResponse.json({
          paper,
          text: cached.raw_text,
          analysis: JSON.parse(cached.analysis_json),
          cached: true,
        });
      }
      
      try {
        // Extract text from PDF using unpdf
        console.log(`[API /arxiv/${id}] Extracting text...`);
        const text = await fetchArxivPdfText(id);
        
        // Analyze the text with Gemini
        console.log(`[API /arxiv/${id}] Analyzing with Gemini...`);
        const analysis = await analyzePaper(text);
        
        // Cache the result
        saveAnalysis(cacheKey, `arxiv-${id}`, text, analysis);
        console.log(`[API /arxiv/${id}] Analysis complete, cached`);
        
        return NextResponse.json({
          paper,
          text,
          analysis,
          cached: false,
        });
      } catch (analysisError) {
        console.error(`[API /arxiv/${id}] Analysis failed:`, analysisError);
        return NextResponse.json(
          { error: "Failed to analyze paper", details: String(analysisError) },
          { status: 500 }
        );
      }
    }
    
    // If text requested but not analysis
    if (includeText) {
      try {
        const text = await fetchArxivPdfText(id);
        return NextResponse.json({ paper, text });
      } catch (textError) {
        console.error(`[API /arxiv/${id}] Text extraction failed:`, textError);
        return NextResponse.json({ paper, textError: String(textError) });
      }
    }
    
    // Just return metadata
    return NextResponse.json({ paper });
  } catch (error) {
    console.error("[API /arxiv/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper", details: String(error) },
      { status: 500 }
    );
  }
}
