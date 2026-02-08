import { NextRequest, NextResponse } from "next/server";
import { traverseSubgraph } from "@/lib/neo4j/queries/traversal";

export async function GET(request: NextRequest) {
  try {
    const rootId = request.nextUrl.searchParams.get("rootId");
    const depth = parseInt(request.nextUrl.searchParams.get("depth") || "3");
    const asOf = request.nextUrl.searchParams.get("asOf") || undefined;

    if (!rootId) {
      return NextResponse.json(
        { error: "rootId parameter is required" },
        { status: 400 }
      );
    }

    const result = await traverseSubgraph(rootId, depth, asOf);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
