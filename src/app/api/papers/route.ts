import { NextResponse } from "next/server";
import { getAllAnalyses } from "@/lib/db";

export async function GET() {
  try {
    const papers = getAllAnalyses();
    return NextResponse.json({ papers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 });
  }
}
