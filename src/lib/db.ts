import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "sciproto-db.json");

// Helper to read DB
function readDb() {
  if (!fs.existsSync(DB_PATH)) return {};
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// Helper to write DB
function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getAnalysis(hash: string) {
  const db = readDb();
  return db[hash] || null;
}

export function saveAnalysis(hash: string, filename: string, raw_text: string, analysis: any) {
  const db = readDb();
  db[hash] = {
    hash,
    filename,
    raw_text,
    analysis_json: JSON.stringify(analysis),
    created_at: Date.now()
  };
  writeDb(db);
}
