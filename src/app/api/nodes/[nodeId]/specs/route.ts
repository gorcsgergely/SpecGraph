import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/neo4j/driver";
import { createRelationship } from "@/lib/neo4j/queries/relationships";
import { createNode } from "@/lib/neo4j/queries/nodes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const result = await executeQuery<{
      spec: Record<string, unknown>;
      relType: string;
    }>(
      `MATCH (n)-[r]->(s:SpecDocument)
       WHERE n.id = $nodeId AND r.valid_to IS NULL AND s.valid_to IS NULL
         AND type(r) IN ['SPECIFIED_BY', 'TESTED_BY', 'IMPLEMENTED_BY']
       RETURN s as spec, type(r) as relType`,
      { nodeId }
    );
    return NextResponse.json(
      result.map((r) => ({ ...r.spec, relationship_type: r.relType }))
    );
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
    const { relationship_type, ...specProps } = body;

    const relType = relationship_type || "SPECIFIED_BY";
    if (!["SPECIFIED_BY", "TESTED_BY", "IMPLEMENTED_BY"].includes(relType)) {
      return NextResponse.json(
        { error: `Invalid spec relationship type: ${relType}` },
        { status: 400 }
      );
    }

    // Create the spec document
    const spec = await createNode("SpecDocument", {
      ...specProps,
      layer: "spec",
    });

    // Create the relationship
    const specRecord = spec as Record<string, unknown>;
    await createRelationship(relType, nodeId, specRecord.id as string);

    return NextResponse.json(spec, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
