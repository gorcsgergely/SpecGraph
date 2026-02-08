import { NextRequest, NextResponse } from "next/server";
import {
  createRelationship,
  getNodeRelationships,
} from "@/lib/neo4j/queries/relationships";
import { RelationshipType } from "@/lib/types/graph";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const direction = (request.nextUrl.searchParams.get("direction") || "both") as
      | "in"
      | "out"
      | "both";
    const relationships = await getNodeRelationships(nodeId, direction);
    return NextResponse.json(relationships);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const body = await request.json();
    const { type, targetId, ...props } = body;

    if (!type || !RelationshipType.safeParse(type).success) {
      return NextResponse.json(
        { error: `Invalid relationship type: ${type}` },
        { status: 400 }
      );
    }

    const relationship = await createRelationship(type, nodeId, targetId, props);
    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
