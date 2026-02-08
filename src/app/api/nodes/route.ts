import { NextRequest, NextResponse } from "next/server";
import { createNode, listNodes } from "@/lib/neo4j/queries/nodes";
import { NodeType } from "@/lib/types/graph";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const result = await listNodes({
      nodeType: params.get("nodeType") as typeof NodeType.enum[keyof typeof NodeType.enum] | undefined,
      layer: params.get("layer") || undefined,
      status: params.get("status") || undefined,
      tags: params.get("tags")?.split(",").filter(Boolean) || undefined,
      search: params.get("search") || undefined,
      asOf: params.get("asOf") || undefined,
      limit: params.get("limit") ? parseInt(params.get("limit")!) : undefined,
      offset: params.get("offset") ? parseInt(params.get("offset")!) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeType, ...props } = body;

    if (!nodeType || !NodeType.safeParse(nodeType).success) {
      return NextResponse.json(
        { error: `Invalid nodeType: ${nodeType}` },
        { status: 400 }
      );
    }

    const node = await createNode(nodeType, props);
    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
