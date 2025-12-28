import { NextRequest, NextResponse } from "next/server";
import { analyzePaper } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const analysis = await analyzePaper(text);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze paper" }, { status: 500 });
  }
}
