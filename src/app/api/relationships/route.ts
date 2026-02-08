import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neo4j/driver";

export async function GET() {
  try {
    const result = await executeQuery<{
      id: string;
      type: string;
      source_id: string;
      target_id: string;
    }>(
      `MATCH (s)-[r]->(t)
       WHERE r.valid_to IS NULL AND s.valid_to IS NULL AND t.valid_to IS NULL
       RETURN r.id as id, type(r) as type, s.id as source_id, t.id as target_id`
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
