import { NextRequest, NextResponse } from "next/server";
import { fullTextSearch } from "@/lib/neo4j/queries/search";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    if (!query) {
      return NextResponse.json(
        { error: "q parameter is required" },
        { status: 400 }
      );
    }

    const results = await fullTextSearch(query, limit);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
