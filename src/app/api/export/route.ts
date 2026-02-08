import { NextRequest, NextResponse } from "next/server";
import { traverseSubgraph } from "@/lib/neo4j/queries/traversal";
import { getNode } from "@/lib/neo4j/queries/nodes";
import { generateMarkdownExport } from "@/lib/export/markdown";
import { runValidation } from "@/lib/validation/engine";

export async function GET(request: NextRequest) {
  try {
    const rootId = request.nextUrl.searchParams.get("rootId");
    const depth = parseInt(request.nextUrl.searchParams.get("depth") || "3");
    const includeValidation =
      request.nextUrl.searchParams.get("validation") !== "false";

    if (!rootId) {
      return NextResponse.json(
        { error: "rootId parameter is required" },
        { status: 400 }
      );
    }

    const rootNode = await getNode(rootId);
    if (!rootNode) {
      return NextResponse.json(
        { error: "Root node not found" },
        { status: 404 }
      );
    }

    const subgraph = await traverseSubgraph(rootId, depth);
    const warnings = includeValidation ? await runValidation() : [];

    // Filter warnings to only those relevant to this subgraph
    const nodeIds = new Set(
      subgraph.nodes.map((n) => (n as Record<string, unknown>).id as string)
    );
    const relevantWarnings = warnings.filter(
      (w) => w.nodeId && nodeIds.has(w.nodeId)
    );

    const rootRecord = rootNode as Record<string, unknown>;
    const markdown = generateMarkdownExport(
      subgraph,
      {
        rootName: rootRecord.name as string,
        depth,
        includeValidation,
      },
      relevantWarnings
    );

    const format = request.nextUrl.searchParams.get("format");
    if (format === "md" || format === "markdown") {
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="specgraph-export-${rootRecord.name}.md"`,
        },
      });
    }

    return NextResponse.json({ markdown, nodeCount: subgraph.nodes.length, relationshipCount: subgraph.relationships.length });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
