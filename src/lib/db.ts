import fs from "fs";
import path from "path";

// ============================================================================
// STORAGE CONFIGURATION
// ============================================================================
// 
// LOCAL DEV: Uses JSON file storage (sciproto-db.json)
// VERCEL PROD: Uses /tmp (ephemeral but writable per invocation)
// 
// For persistent Vercel storage, add Vercel KV:
//   1. Add KV from Vercel dashboard
//   2. pnpm add @vercel/kv
//   3. Replace functions below with kv.get/kv.set
// ============================================================================

// On Vercel, use /tmp which is writable (but ephemeral per invocation)
// Locally, use project root
const isVercel = process.env.VERCEL === "1";
const DB_PATH = isVercel 
  ? "/tmp/sciproto-db.json"
  : path.join(process.cwd(), "sciproto-db.json");

interface DbSchema {
  analyses: Record<string, AnalysisEntry>;
  prototypes: Record<string, PrototypeEntry>;
}

interface AnalysisEntry {
  hash: string;
  filename: string;
  raw_text: string;
  analysis_json: string;
  created_at: number;
}

interface PrototypeEntry {
  id: string;
  paper_hash?: string;
  title: string;
  description?: string;
  code: string;
  algorithm_info?: string;
  history: any[];
  created_at: number;
  updated_at: number;
}

// Helper to read DB (safe for serverless)
function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { analyses: {}, prototypes: {} };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(data);
    // Migration: handle old format where analyses were at root level
    if (!parsed.analyses && !parsed.prototypes) {
      return { analyses: parsed, prototypes: {} };
    }
    return { analyses: parsed.analyses || {}, prototypes: parsed.prototypes || {} };
  } catch (e) {
    // If read fails (e.g., corruption), return empty
    console.warn("[DB] Read failed, returning empty:", e);
    return { analyses: {}, prototypes: {} };
  }
}

// Helper to write DB (safe for serverless)
function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    // On Vercel, /tmp writes might fail in edge cases - log but don't crash
    console.warn("[DB] Write failed (serverless?):", e);
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS (existing)
// ============================================================================

export function getAnalysis(hash: string) {
  const db = readDb();
  return db.analyses[hash] || null;
}

export function saveAnalysis(hash: string, filename: string, raw_text: string, analysis: any) {
  const db = readDb();
  db.analyses[hash] = {
    hash,
    filename,
    raw_text,
    analysis_json: JSON.stringify(analysis),
    created_at: Date.now()
  };
  writeDb(db);
}

export function getAllAnalyses() {
  const db = readDb();
  // Return array sorted by newest first
  return Object.values(db.analyses).sort((a: any, b: any) => b.created_at - a.created_at);
}

// ============================================================================
// PROTOTYPE FUNCTIONS (new)
// ============================================================================

export function getPrototype(id: string): PrototypeEntry | null {
  const db = readDb();
  return db.prototypes[id] || null;
}

export function savePrototype(
  id: string, 
  data: {
    paper_hash?: string;
    title: string;
    description?: string;
    code: string;
    algorithm_info?: string;
    history: any[];
  }
) {
  const db = readDb();
  const existing = db.prototypes[id];
  
  db.prototypes[id] = {
    id,
    paper_hash: data.paper_hash,
    title: data.title,
    description: data.description || "",
    code: data.code,
    algorithm_info: data.algorithm_info || "",
    history: data.history,
    created_at: existing?.created_at || Date.now(),
    updated_at: Date.now()
  };
  writeDb(db);
}

export function updatePrototypeCode(id: string, code: string, algorithm_info?: string) {
  const db = readDb();
  if (db.prototypes[id]) {
    db.prototypes[id].code = code;
    if (algorithm_info) db.prototypes[id].algorithm_info = algorithm_info;
    db.prototypes[id].updated_at = Date.now();
    writeDb(db);
  }
}

export function updatePrototypeHistory(id: string, history: any[]) {
  const db = readDb();
  if (db.prototypes[id]) {
    db.prototypes[id].history = history;
    db.prototypes[id].updated_at = Date.now();
    writeDb(db);
  }
}

export function getAllPrototypes(): PrototypeEntry[] {
  const db = readDb();
  return Object.values(db.prototypes).sort((a, b) => b.updated_at - a.updated_at);
}

export function deletePrototype(id: string) {
  const db = readDb();
  delete db.prototypes[id];
  writeDb(db);
}
