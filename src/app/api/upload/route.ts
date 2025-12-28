export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Lazy load pdf-parse to avoid build-time evaluation issues
    let pdfModule = require("pdf-parse");
    // Check if default export is the module itself
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

    let data;
    // Attempt to parse using the class-based API of this version
    if (pdfModule.PDFParse) {
         try {
            // Correct usage: new PDFParse({ data: buffer })
            const parser = new pdfModule.PDFParse({ data: buffer });
            const textResult = await parser.getText();
            data = { text: textResult.text };
         } catch(e: any) {
             console.error("PDF Parsing failed:", e);
             throw new Error("PDF Parsing failed: " + e.message);
         }
    } else if (typeof pdfModule === 'function') {
         // Fallback to function style
         data = await pdfModule(buffer);
    } else {
        throw new Error("Could not find PDF parsing function in module: " + Object.keys(pdfModule).join(", "));
    }

    return NextResponse.json({ 
      text: data.text,
      info: data.info,
      metadata: data.metadata 
    });
  } catch (error) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
