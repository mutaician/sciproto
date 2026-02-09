# SciProto 🔬

**Transform Research Papers into Interactive Prototypes**

SciProto is an AI-powered platform that analyzes academic papers and generates interactive visualizations, helping you understand complex algorithms through hands-on exploration.

> Built for the Gemini 3 Hackathon

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![Gemini 3](https://img.shields.io/badge/Gemini-3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- **📄 Paper Analysis** - Upload any PDF or fetch from arXiv. Gemini 3 Pro extracts key algorithms, equations, and simulation opportunities
- **🎮 Interactive Prototypes** - Each concept becomes a live React component with sliders, charts, and animations
- **💬 Conversational Agent** - Chat to modify prototypes ("add gravity", "change the decay rate")
- **🔍 arXiv Discovery** - Browse and analyze papers directly from arXiv's database
- **💾 Smart Caching** - Papers and prototypes are cached by content hash for instant reloads

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 15 + React + Framer Motion + TailwindCSS          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Routes                            │
│  /api/upload    - PDF parsing + hash generation             │
│  /api/analyze   - Full paper analysis (Gemini 3 Pro)        │
│  /api/agent     - Streaming chat + prototype gen (Flash)    │
│  /api/papers    - Paper CRUD                                │
│  /api/prototypes - Prototype storage                        │
│  /api/arxiv     - arXiv search proxy                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Gemini 3 Models                        │
│  gemini-3-pro-preview   - Deep paper analysis (JSON)        │
│  gemini-3-flash-preview - Agent chat + code generation      │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Gemini API key from [AI Studio](https://aistudio.google.com)

### Installation

```bash
# Clone the repo
git clone https://github.com/mutaician/sciproto.git
cd sciproto

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agent/       # Streaming chat agent
│   │   ├── analyze/     # Paper analysis endpoint
│   │   ├── arxiv/       # arXiv search proxy
│   │   ├── papers/      # Paper storage
│   │   ├── prototypes/  # Prototype CRUD
│   │   └── upload/      # PDF upload + parsing
│   ├── discover/        # arXiv browser
│   ├── papers/          # Paper library
│   │   └── [hash]/      # Individual paper view
│   └── prototype/
│       └── [id]/        # Prototype sandbox
├── components/
│   ├── AnalysisPanel.tsx    # Paper analysis display
│   ├── ChatInterface.tsx     # Agent conversation
│   ├── PrototypeRenderer.tsx # Sandboxed React runner
│   └── UploadZone.tsx        # PDF drag-and-drop
└── lib/
    ├── arxiv.ts    # arXiv API client
    ├── db.ts       # JSON file storage (dev) / Vercel KV (prod)
    └── gemini.ts   # Gemini API wrapper + schemas
```

## 🔧 Key Technologies

| Tech | Purpose |
|------|---------|
| **Next.js 15** | App Router, API routes, Turbopack |
| **Gemini 3 Pro** | Structured paper analysis with JSON schema |
| **Gemini 3 Flash** | Fast streaming agent + function calling |
| **Framer Motion** | Smooth animations and transitions |
| **Recharts** | Data visualization in prototypes |
| **pdf-parse** | PDF text extraction |
| **Zod** | Schema validation for Gemini responses |

## 📝 How It Works

### 1. Paper Upload
PDF → text extraction → SHA-256 hash → cache check → return text

### 2. Analysis (Gemini 3 Pro)
```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: paperText,
  config: {
    responseMimeType: "application/json",
    responseSchema: PaperAnalysisSchema,
  },
});
```

Returns: title, summary, breakthrough_score, key_claims, testable_hypotheses, key_equations, simulation_possibilities

### 3. Prototype Generation (Gemini 3 Flash)
```typescript
const response = await ai.models.generateContentStream({
  model: "gemini-3-flash-preview",
  contents: chatHistory,
  config: {
    tools: [{
      functionDeclarations: [{
        name: "render_prototype",
        parameters: { code: "string", title: "string" }
      }]
    }]
  },
});
```

Streams text + function calls via NDJSON

### 4. Sandbox Rendering
Generated React code runs in an isolated iframe with:
- Recharts, Framer Motion, Lucide icons pre-loaded
- Tailwind CSS for styling
- Error boundary with retry capability

---

Built with ❤️ for the [Gemini 3 Hackathon](https://gemini3.devpost.com/)
