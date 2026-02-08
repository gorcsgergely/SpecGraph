import { NextRequest, NextResponse } from "next/server";
import { getNodeHistory } from "@/lib/neo4j/queries/nodes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const { nodeId } = await params;
    const history = await getNodeHistory(nodeId);
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
