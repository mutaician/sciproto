/**
 * arXiv API Client
 * 
 * Provides functions to search and fetch papers from arXiv.
 * API Documentation: https://info.arxiv.org/help/api/basics.html
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ArxivPaper {
  id: string;           // arXiv ID (e.g., "2401.12345")
  title: string;
  authors: string[];
  summary: string;      // Abstract
  published: string;    // ISO date string
  updated: string;      // ISO date string
  categories: string[]; // e.g., ["cs.AI", "cs.LG"]
  primaryCategory: string;
  pdfUrl: string;
  arxivUrl: string;
  doi?: string;
  journalRef?: string;
  comment?: string;
}

export interface ArxivSearchParams {
  query?: string;           // Free text search
  category?: string;        // Category filter (e.g., "cs.AI")
  author?: string;          // Author search
  title?: string;           // Title search
  abstract?: string;        // Abstract search
  start?: number;           // Pagination start (default 0)
  maxResults?: number;      // Max results (default 20, max 100)
  sortBy?: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder?: "ascending" | "descending";
}

export interface ArxivSearchResult {
  papers: ArxivPaper[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ARXIV_API_BASE = "https://export.arxiv.org/api/query";

// Popular arXiv categories for the discover page
export const ARXIV_CATEGORIES = {
  // Computer Science
  "cs.AI": "Artificial Intelligence",
  "cs.LG": "Machine Learning",
  "cs.CL": "Computation and Language (NLP)",
  "cs.CV": "Computer Vision",
  "cs.NE": "Neural and Evolutionary Computing",
  "cs.RO": "Robotics",
  "cs.CR": "Cryptography and Security",
  "cs.DS": "Data Structures and Algorithms",
  "cs.SE": "Software Engineering",
  "cs.HC": "Human-Computer Interaction",
  
  // Physics
  "physics.comp-ph": "Computational Physics",
  "quant-ph": "Quantum Physics",
  "cond-mat": "Condensed Matter",
  "hep-th": "High Energy Physics - Theory",
  
  // Mathematics
  "math.OC": "Optimization and Control",
  "math.ST": "Statistics Theory",
  "math.NA": "Numerical Analysis",
  
  // Statistics
  "stat.ML": "Machine Learning (Statistics)",
  "stat.TH": "Statistics Theory",
  
  // Quantitative Biology
  "q-bio.NC": "Neurons and Cognition",
  "q-bio.GN": "Genomics",
  
  // Electrical Engineering
  "eess.SP": "Signal Processing",
  "eess.SY": "Systems and Control",
} as const;

export type ArxivCategory = keyof typeof ARXIV_CATEGORIES;

// Category groups for UI
export const CATEGORY_GROUPS = {
  "AI & ML": ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "stat.ML"],
  "Computer Science": ["cs.RO", "cs.CR", "cs.DS", "cs.SE", "cs.HC"],
  "Physics": ["physics.comp-ph", "quant-ph", "cond-mat", "hep-th"],
  "Mathematics": ["math.OC", "math.ST", "math.NA"],
  "Biology & Medicine": ["q-bio.NC", "q-bio.GN"],
  "Engineering": ["eess.SP", "eess.SY"],
} as const;

// ============================================================================
// XML PARSING WITH fast-xml-parser (Node.js compatible)
// ============================================================================

import { XMLParser } from "fast-xml-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type XmlEntry = any;

/**
 * Parse a single arXiv entry from parsed XML object
 */
function parseArxivEntry(entry: XmlEntry): ArxivPaper {
  // Get ID and clean it (remove version suffix for cleaner display)
  const idUrl = String(entry.id || "");
  const idMatch = idUrl.match(/abs\/(.+?)(?:v\d+)?$/);
  const id = idMatch ? idMatch[1] : idUrl.split("/").pop() || "";
  
  // Get title (remove newlines and extra spaces)
  const title = String(entry.title || "").replace(/\s+/g, " ").trim();
  
  // Get authors - can be single object or array
  const authorData = entry.author;
  let authors: string[] = [];
  if (Array.isArray(authorData)) {
    authors = authorData.map((a: XmlEntry) => String(a.name || "")).filter(Boolean);
  } else if (authorData?.name) {
    authors = [String(authorData.name)];
  }
  
  // Get summary/abstract
  const summary = String(entry.summary || "").replace(/\s+/g, " ").trim();
  
  // Get dates
  const published = String(entry.published || "");
  const updated = String(entry.updated || "");
  
  // Get categories - can be single object or array
  const categoryData = entry.category;
  let categories: string[] = [];
  if (Array.isArray(categoryData)) {
    categories = categoryData.map((c: XmlEntry) => c["@_term"] || "").filter(Boolean);
  } else if (categoryData?.["@_term"]) {
    categories = [categoryData["@_term"]];
  }
  
  // Get primary category (arxiv:primary_category)
  const primaryCategoryData = entry["arxiv:primary_category"];
  const primaryCategory = primaryCategoryData?.["@_term"] || categories[0] || "";
  
  // Get links - can be single object or array
  const linkData = entry.link;
  let pdfUrl = "";
  let arxivUrl = "";
  
  const links = Array.isArray(linkData) ? linkData : linkData ? [linkData] : [];
  links.forEach((link: XmlEntry) => {
    const href = link["@_href"] || "";
    const type = link["@_type"] || "";
    const linkTitle = link["@_title"] || "";
    
    if (linkTitle === "pdf" || type === "application/pdf") {
      pdfUrl = href;
    } else if (link["@_rel"] === "alternate") {
      arxivUrl = href;
    }
  });
  
  // Fallback URLs
  if (!pdfUrl) pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
  if (!arxivUrl) arxivUrl = `https://arxiv.org/abs/${id}`;
  
  // Get optional fields
  const doi = String(entry["arxiv:doi"] || "");
  const journalRef = String(entry["arxiv:journal_ref"] || "");
  const comment = String(entry["arxiv:comment"] || "");
  
  return {
    id,
    title,
    authors,
    summary,
    published,
    updated,
    categories,
    primaryCategory,
    pdfUrl,
    arxivUrl,
    ...(doi && { doi }),
    ...(journalRef && { journalRef }),
    ...(comment && { comment }),
  };
}

/**
 * Parse arXiv API XML response using fast-xml-parser
 */
function parseArxivResponse(xmlText: string): ArxivSearchResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  
  const parsed = parser.parse(xmlText);
  const feed = parsed.feed;
  
  if (!feed) {
    throw new Error("Failed to parse arXiv response: no feed element");
  }
  
  // Get feed metadata (opensearch namespace)
  const totalResults = parseInt(String(feed["opensearch:totalResults"] || "0"), 10);
  const startIndex = parseInt(String(feed["opensearch:startIndex"] || "0"), 10);
  const itemsPerPage = parseInt(String(feed["opensearch:itemsPerPage"] || "0"), 10);
  
  // Parse entries - can be single object, array, or undefined
  const entryData = feed.entry;
  let papers: ArxivPaper[] = [];
  
  if (Array.isArray(entryData)) {
    papers = entryData.map(parseArxivEntry);
  } else if (entryData) {
    papers = [parseArxivEntry(entryData)];
  }
  
  return {
    papers,
    totalResults,
    startIndex,
    itemsPerPage,
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Build arXiv API query string
 */
function buildSearchQuery(params: ArxivSearchParams): string {
  const queryParts: string[] = [];
  
  // Free text search (searches all fields)
  if (params.query) {
    queryParts.push(`all:${params.query}`);
  }
  
  // Category filter
  if (params.category) {
    queryParts.push(`cat:${params.category}`);
  }
  
  // Author search
  if (params.author) {
    queryParts.push(`au:${params.author}`);
  }
  
  // Title search
  if (params.title) {
    queryParts.push(`ti:${params.title}`);
  }
  
  // Abstract search
  if (params.abstract) {
    queryParts.push(`abs:${params.abstract}`);
  }
  
  // If no specific query, default to a broad search
  if (queryParts.length === 0) {
    queryParts.push("cat:cs.AI"); // Default to AI papers
  }
  
  return queryParts.join("+AND+");
}

/**
 * Search arXiv papers
 */
export async function searchArxiv(params: ArxivSearchParams = {}): Promise<ArxivSearchResult> {
  const searchQuery = buildSearchQuery(params);
  
  const urlParams = new URLSearchParams({
    search_query: searchQuery,
    start: String(params.start || 0),
    max_results: String(Math.min(params.maxResults || 20, 100)),
    sortBy: params.sortBy || "submittedDate",
    sortOrder: params.sortOrder || "descending",
  });
  
  const url = `${ARXIV_API_BASE}?${urlParams.toString()}`;
  
  console.log("[arXiv] Fetching:", url);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SciProto/1.0 (Research Paper Prototype Generator)",
    },
    // Cache for 5 minutes
    next: { revalidate: 300 },
  });
  
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status} ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  return parseArxivResponse(xmlText);
}

/**
 * Fetch a specific paper by arXiv ID
 */
export async function fetchArxivPaper(arxivId: string): Promise<ArxivPaper | null> {
  // Clean the ID (remove version if present)
  const cleanId = arxivId.replace(/v\d+$/, "");
  
  const url = `${ARXIV_API_BASE}?id_list=${cleanId}`;
  
  console.log("[arXiv] Fetching paper:", url);
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SciProto/1.0 (Research Paper Prototype Generator)",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status} ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  const result = parseArxivResponse(xmlText);
  
  return result.papers[0] || null;
}

/**
 * Fetch PDF content from arXiv and extract text using Gemini
 * Uses Gemini's native PDF understanding (serverless compatible)
 */
export async function fetchArxivPdfText(arxivId: string): Promise<string> {
  // Import here to avoid circular dependency at module load time
  const { extractPdfText } = await import("./gemini");
  
  const cleanId = arxivId.replace(/v\d+$/, "");
  const pdfUrl = `https://arxiv.org/pdf/${cleanId}.pdf`;
  
  console.log("[arXiv] Fetching PDF:", pdfUrl);
  
  const response = await fetch(pdfUrl, {
    headers: {
      "User-Agent": "SciProto/1.0 (Research Paper Prototype Generator)",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Use Gemini to extract text (serverless compatible)
  console.log("[arXiv] Extracting text with Gemini...");
  const text = await extractPdfText(buffer);
  
  return text;
}

/**
 * Get trending papers (most recent in popular categories)
 */
export async function getTrendingPapers(maxResults: number = 20): Promise<ArxivPaper[]> {
  // Search across popular AI/ML categories
  const result = await searchArxiv({
    category: "cs.AI OR cs.LG OR cs.CL OR cs.CV",
    maxResults,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  
  return result.papers;
}

/**
 * Get papers from today
 */
export async function getTodaysPapers(category?: string, maxResults: number = 20): Promise<ArxivPaper[]> {
  const result = await searchArxiv({
    category: category || "cs.AI",
    maxResults,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });
  
  // Filter to only papers from today (arXiv updates around midnight EST)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Actually, arXiv's "today" is a bit complex due to submission deadlines
  // For now, just return the most recent papers
  return result.papers;
}

/**
 * Format date for display
 */
export function formatArxivDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get relative time string
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
