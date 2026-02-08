import { NextRequest, NextResponse } from "next/server";
import { runValidation, runValidationForNode } from "@/lib/validation/engine";

export async function GET(request: NextRequest) {
  try {
    const nodeId = request.nextUrl.searchParams.get("nodeId");
    const rules = request.nextUrl.searchParams.get("rules")?.split(",").filter(Boolean);

    if (nodeId) {
      const warnings = await runValidationForNode(nodeId);
      return NextResponse.json(warnings);
    }

    const warnings = await runValidation(rules || undefined);
    return NextResponse.json(warnings);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
