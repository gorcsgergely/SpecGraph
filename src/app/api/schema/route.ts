import { NextResponse } from "next/server";
import { initializeSchema } from "@/lib/neo4j/schema";

export async function POST() {
  try {
    await initializeSchema();
    return NextResponse.json({ success: true, message: "Schema initialized" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
