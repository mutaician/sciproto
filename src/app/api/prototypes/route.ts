import { NextRequest, NextResponse } from "next/server";
import { getPrototype, savePrototype, updatePrototypeCode, updatePrototypeHistory, getAllPrototypes, deletePrototype } from "@/lib/db";

// GET - Retrieve a prototype by ID or list all
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const prototype = getPrototype(id);
    if (!prototype) {
      return NextResponse.json({ error: "Prototype not found" }, { status: 404 });
    }
    return NextResponse.json(prototype);
  }

  // Return all prototypes
  const prototypes = getAllPrototypes();
  return NextResponse.json({ prototypes });
}

// POST - Create or update a prototype
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, paper_hash, title, description, code, algorithm_info, history } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    savePrototype(id, {
      paper_hash,
      title: title || "Untitled Prototype",
      description,
      code: code || "",
      algorithm_info,
      history: history || [],
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Save prototype error:", error);
    return NextResponse.json({ error: "Failed to save prototype" }, { status: 500 });
  }
}

// PATCH - Update specific fields of a prototype
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, algorithm_info, history } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = getPrototype(id);
    if (!existing) {
      return NextResponse.json({ error: "Prototype not found" }, { status: 404 });
    }

    if (code !== undefined) {
      updatePrototypeCode(id, code, algorithm_info);
    }
    
    if (history !== undefined) {
      updatePrototypeHistory(id, history);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update prototype error:", error);
    return NextResponse.json({ error: "Failed to update prototype" }, { status: 500 });
  }
}

// DELETE - Remove a prototype
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  deletePrototype(id);
  return NextResponse.json({ success: true });
}
