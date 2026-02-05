import { NextRequest, NextResponse } from "next/server";
import { fetchArxivPaper, fetchArxivPdfText } from "@/lib/arxiv";

/**
 * GET /api/arxiv/[id]
 * 
 * Fetch a specific arXiv paper by ID
 * 
 * Query params:
 * - text: If "true", also fetch and extract PDF text (slower)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const includeText = searchParams.get("text") === "true";
    
    console.log(`[API /arxiv/${id}] Fetching paper, includeText=${includeText}`);
    
    // Fetch paper metadata
    const paper = await fetchArxivPaper(id);
    
    if (!paper) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      );
    }
    
    // Optionally fetch PDF text
    let text: string | undefined;
    if (includeText) {
      try {
        text = await fetchArxivPdfText(id);
      } catch (pdfError) {
        console.error(`[API /arxiv/${id}] Failed to extract PDF text:`, pdfError);
        // Don't fail the whole request, just skip text extraction
      }
    }
    
    return NextResponse.json({
      paper,
      ...(text && { text }),
    });
  } catch (error) {
    console.error("[API /arxiv/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper", details: String(error) },
      { status: 500 }
    );
  }
}
