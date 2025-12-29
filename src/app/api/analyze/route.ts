import { NextRequest, NextResponse } from "next/server";
import { analyzePaper } from "@/lib/gemini";
import { saveAnalysis } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { text, hash, filename } = await req.json();

    if (!text && !hash) { // Allow hash-only if we supported refetching from db, but for now we rely on re-analyzing text
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Double check cache if hash provided (redundant but safe)
    // Actually, if we are here, it means cache missed or force refresh.
    
    console.log("Analyzing paper...");
    const analysis = await analyzePaper(text);
    
    // Save to Cache if hash is present
    if (hash) {
        saveAnalysis(hash, filename || "unknown.pdf", text, analysis);
        console.log("Saved analysis to cache:", hash);
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze paper" }, { status: 500 });
  }
}
