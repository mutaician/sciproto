export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/db";
import { extractText } from "unpdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Compute Hash for Caching
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Check Cache (analysis already done before)
    const cached = getAnalysis(hashHex);
    if (cached) {
        console.log("Cache Hit:", hashHex);
         return NextResponse.json({ 
             text: cached.raw_text,
             hash: hashHex,
             cachedAnalysis: JSON.parse(cached.analysis_json)
         });
    }

    // 3. Extract text from PDF using unpdf (serverless compatible)
    console.log("Extracting PDF text...");
    const result = await extractText(buffer);
    // unpdf returns text as array of strings (one per page), join them
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;

    return NextResponse.json({ text, hash: hashHex });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
