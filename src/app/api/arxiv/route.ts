import { NextRequest, NextResponse } from "next/server";
import { searchArxiv, ArxivSearchParams } from "@/lib/arxiv";

/**
 * GET /api/arxiv
 * 
 * Search arXiv papers with various filters
 * 
 * Query params:
 * - q: Free text search query
 * - category: arXiv category (e.g., "cs.AI")
 * - author: Author name search
 * - title: Title search
 * - start: Pagination start index (default 0)
 * - max: Max results (default 20, max 100)
 * - sort: Sort by ("relevance" | "lastUpdatedDate" | "submittedDate")
 * - order: Sort order ("ascending" | "descending")
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const params: ArxivSearchParams = {
      query: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      author: searchParams.get("author") || undefined,
      title: searchParams.get("title") || undefined,
      start: parseInt(searchParams.get("start") || "0", 10),
      maxResults: Math.min(parseInt(searchParams.get("max") || "20", 10), 100),
      sortBy: (searchParams.get("sort") as ArxivSearchParams["sortBy"]) || "submittedDate",
      sortOrder: (searchParams.get("order") as ArxivSearchParams["sortOrder"]) || "descending",
    };
    
    console.log("[API /arxiv] Search params:", params);
    
    const result = await searchArxiv(params);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /arxiv] Error:", error);
    return NextResponse.json(
      { error: "Failed to search arXiv", details: String(error) },
      { status: 500 }
    );
  }
}
