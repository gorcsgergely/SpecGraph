import { NextRequest, NextResponse } from "next/server";
import {
  getRelationship,
  deleteRelationship,
} from "@/lib/neo4j/queries/relationships";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ relId: string }> }
) {
  try {
    const { relId } = await params;
    const rel = await getRelationship(relId);
    if (!rel) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(rel);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ relId: string }> }
) {
  try {
    const { relId } = await params;
    const deleted = await deleteRelationship(relId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Relationship not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
