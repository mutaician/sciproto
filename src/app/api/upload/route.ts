export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/db";
// crypto is available globally in Node 19+ / Bun

export async function POST(req: NextRequest) {
  try {
    // Lazy load pdf-parse
    let pdfModule = require("pdf-parse");
    // Handle ESM default export if present
    if (pdfModule.default) {
        pdfModule = pdfModule.default;
    }
    
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

    // 2. Check Cache
    const cached = getAnalysis(hashHex);
    if (cached) {
        console.log("Cache Hit:", hashHex);
         return NextResponse.json({ 
             text: cached.raw_text,
             hash: hashHex,
             cachedAnalysis: JSON.parse(cached.analysis_json)
         });
    }

    // 3. Parse PDF if not cached
    let text = "";
    try {
        let pdfData;
        if (pdfModule.PDFParse) {
             // Class-based API
             const parser = new pdfModule.PDFParse({ data: buffer });
             pdfData = await parser.getText();
        } else if (typeof pdfModule === 'function') {
             // Function-based API
             pdfData = await pdfModule(buffer);
        } else {
            throw new Error("Unknown pdf-parse module structure");
        }
        text = pdfData.text;
    } catch(parseError: any) {
        console.error("PDF Parsing failed:", parseError);
        return NextResponse.json({ error: "Failed to parse PDF: " + parseError.message }, { status: 500 });
    }

    return NextResponse.json({ text, hash: hashHex });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
