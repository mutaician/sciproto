# SciProto - Vercel Deployment Guide

## 🚀 Quick Deploy Steps

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Add environment variable: `GEMINI_API_KEY`
4. Deploy!

## ⚠️ Important: Storage on Vercel

The current file-based storage (`sciproto-db.json`) **will NOT work** on Vercel because:
- Vercel functions are serverless and stateless
- File system is read-only in production
- Each request may run on a different server

## 🔧 Option 1: Vercel KV (Recommended - Free Tier Available)

Vercel KV is a Redis-based key-value store. Perfect for this app.

### Step 1: Create KV Database

```bash
# In your project directory:
pnpm add @vercel/kv

# Or via Vercel Dashboard:
# 1. Go to your project on vercel.com
# 2. Click "Storage" tab
# 3. Click "Create Database" → "KV"
# 4. Name it "sciproto-db"
# 5. Click "Create"
```

### Step 2: Connect to Your Project

After creating the database:
1. Go to the KV database settings
2. Click "Connect to Project"
3. Select your SciProto project
4. This automatically adds the required env vars:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Update src/lib/db.ts

Replace the entire file with:

```typescript
import { kv } from '@vercel/kv';

// ============================================================================
// VERCEL KV STORAGE
// ============================================================================

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
  history: Array<{ role: string; parts: { text: string }[] }>;
  created_at: number;
  updated_at: number;
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export async function getAnalysis(hash: string): Promise<AnalysisEntry | null> {
  return await kv.get<AnalysisEntry>(`analysis:${hash}`);
}

export async function saveAnalysis(
  hash: string, 
  filename: string, 
  raw_text: string, 
  analysis: unknown
): Promise<void> {
  const entry: AnalysisEntry = {
    hash,
    filename,
    raw_text,
    analysis_json: JSON.stringify(analysis),
    created_at: Date.now()
  };
  await kv.set(`analysis:${hash}`, entry);
  
  // Also add to index for listing
  await kv.zadd('analyses:index', { score: entry.created_at, member: hash });
}

export async function getAllAnalyses(): Promise<AnalysisEntry[]> {
  // Get all analysis hashes sorted by creation time (newest first)
  const hashes = await kv.zrange<string[]>('analyses:index', 0, -1, { rev: true });
  
  if (!hashes || hashes.length === 0) return [];
  
  // Fetch all analyses
  const analyses = await Promise.all(
    hashes.map(hash => kv.get<AnalysisEntry>(`analysis:${hash}`))
  );
  
  return analyses.filter((a): a is AnalysisEntry => a !== null);
}

// ============================================================================
// PROTOTYPE FUNCTIONS
// ============================================================================

export async function getPrototype(id: string): Promise<PrototypeEntry | null> {
  return await kv.get<PrototypeEntry>(`prototype:${id}`);
}

export async function savePrototype(
  id: string, 
  data: {
    paper_hash?: string;
    title: string;
    description?: string;
    code: string;
    algorithm_info?: string;
    history: Array<{ role: string; parts: { text: string }[] }>;
  }
): Promise<void> {
  const existing = await getPrototype(id);
  
  const entry: PrototypeEntry = {
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
  
  await kv.set(`prototype:${id}`, entry);
  await kv.zadd('prototypes:index', { score: entry.updated_at, member: id });
}

export async function updatePrototypeCode(
  id: string, 
  code: string, 
  algorithm_info?: string
): Promise<void> {
  const existing = await getPrototype(id);
  if (!existing) return;
  
  existing.code = code;
  if (algorithm_info) existing.algorithm_info = algorithm_info;
  existing.updated_at = Date.now();
  
  await kv.set(`prototype:${id}`, existing);
}

export async function updatePrototypeHistory(
  id: string, 
  history: Array<{ role: string; parts: { text: string }[] }>
): Promise<void> {
  const existing = await getPrototype(id);
  if (!existing) return;
  
  existing.history = history;
  existing.updated_at = Date.now();
  
  await kv.set(`prototype:${id}`, existing);
}

export async function getAllPrototypes(): Promise<PrototypeEntry[]> {
  const ids = await kv.zrange<string[]>('prototypes:index', 0, -1, { rev: true });
  
  if (!ids || ids.length === 0) return [];
  
  const prototypes = await Promise.all(
    ids.map(id => kv.get<PrototypeEntry>(`prototype:${id}`))
  );
  
  return prototypes.filter((p): p is PrototypeEntry => p !== null);
}

export async function deletePrototype(id: string): Promise<void> {
  await kv.del(`prototype:${id}`);
  await kv.zrem('prototypes:index', id);
}
```

### Step 4: Update API Routes to be Async

The API routes need to `await` the db functions now. Update these files:

**src/app/api/papers/route.ts:**
```typescript
// Change from:
const analyses = getAllAnalyses();
// To:
const analyses = await getAllAnalyses();
```

**src/app/api/prototypes/route.ts:**
```typescript
// All db functions need await
const prototype = await getPrototype(id);
await savePrototype(id, { ... });
```

### Step 5: Local Development with Vercel KV

To use KV locally:

```bash
# Pull env vars from Vercel
vercel env pull .env.local

# Or add to .env.local manually:
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
```

## 🔧 Option 2: Keep File Storage (Dev Only)

If you just want to demo locally and don't need persistence on Vercel:
- The app will work but data won't persist between deployments
- Good for hackathon demos where you upload fresh each time

## 🔧 Option 3: External Database

For more complex needs, consider:
- **Supabase** (Postgres + Auth) - Great if you need user accounts
- **PlanetScale** (MySQL) - Serverless MySQL
- **Neon** (Postgres) - Serverless Postgres
- **Upstash** (Redis) - Similar to Vercel KV, works anywhere

## 📝 Environment Variables Checklist

Make sure these are set in Vercel:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `KV_URL` | If using KV | Auto-set when you connect KV |
| `KV_REST_API_URL` | If using KV | Auto-set when you connect KV |
| `KV_REST_API_TOKEN` | If using KV | Auto-set when you connect KV |

## 🎯 Quick Vercel KV Pricing

- **Free (Hobby)**: 30K requests/day, 256MB storage
- **Pro**: 150K requests/day, 1GB storage, $1/100K extra requests

For a hackathon demo, the free tier is more than enough!
