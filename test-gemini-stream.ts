
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenAI({ apiKey });

const tool = {
  functionDeclarations: [
    {
      name: "test_tool",
      description: "A test tool",
      parameters: {
        type: "OBJECT",
        properties: {
            arg: { type: "STRING" }
        }
      }
    }
  ]
};

async function run() {
  const model = "gemini-3-flash-preview"; 
  // or "gemini-2.0-flash-exp" if 3 is not fully public yet, but user code uses 3.
  
  console.log("Starting stream...");
  try {
      const result = await genAI.models.generateContentStream({
        model: "gemini-2.0-flash-exp", // Fallback to 2.0 ensuring it works, then try 3
        contents: { role: "user", parts: [{ text: "Call the test_tool with arg 'hello'" }] },
        config: {
            tools: [tool],
        }
      });

      // console.log("Result keys:", Object.keys(result));
      // console.log("Result stream keys:", result.stream ? Object.keys(result.stream) : "No stream prop");

      for await (const chunk of result.stream) {
          console.log("--- Chunk ---");
          console.log("Keys:", Object.keys(chunk));
          // console.log("Chunk:", JSON.stringify(chunk, null, 2));
          
          if (typeof chunk.text === 'function') {
              console.log("chunk.text():", chunk.text());
          } else {
              console.log("chunk.text is NOT a function");
          }

          if (typeof chunk.functionCalls === 'function') {
             console.log("chunk.functionCalls():", chunk.functionCalls());
          }
      }
  } catch (e) {
      console.error(e);
  }
}

run();
