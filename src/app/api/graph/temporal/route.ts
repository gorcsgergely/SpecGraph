import { NextRequest, NextResponse } from "next/server";
import { listNodes } from "@/lib/neo4j/queries/nodes";
import { traverseSubgraph } from "@/lib/neo4j/queries/traversal";

export async function GET(request: NextRequest) {
  try {
    const asOf = request.nextUrl.searchParams.get("asOf");
    const rootId = request.nextUrl.searchParams.get("rootId");

    if (!asOf) {
      return NextResponse.json(
        { error: "asOf parameter is required (ISO date string)" },
        { status: 400 }
      );
    }

    if (rootId) {
      const depth = parseInt(
        request.nextUrl.searchParams.get("depth") || "3"
      );
      const result = await traverseSubgraph(rootId, depth, asOf);
      return NextResponse.json(result);
    } else {
      const result = await listNodes({ asOf });
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
