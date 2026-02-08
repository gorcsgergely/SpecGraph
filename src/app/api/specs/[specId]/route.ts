import { NextRequest, NextResponse } from "next/server";
import { getNode, updateNode, deleteNode } from "@/lib/neo4j/queries/nodes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params;
    const spec = await getNode(specId);
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params;
    const body = await request.json();
    const spec = await updateNode(specId, body);
    if (!spec) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ specId: string }> }
) {
  try {
    const { specId } = await params;
    const deleted = await deleteNode(specId);
    if (!deleted) {
      return NextResponse.json({ error: "Spec not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
