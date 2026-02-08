import type { TraversalResult } from "../neo4j/queries/traversal";
import type { GraphNode, NodeType } from "../types/graph";

const MERMAID_STYLES: Record<NodeType, string> = {
  BusinessCapability: ":::business",
  BusinessService: ":::business",
  BusinessProcess: ":::business",
  ProcessStep: ":::business",
  DataEntity: ":::data",
  Application: ":::application",
  ApplicationComponent: ":::application",
  API: ":::application",
  SpecDocument: ":::spec",
};

export function generateMermaidFromSubgraph(subgraph: TraversalResult): string {
  const lines: string[] = [
    "graph TD",
    "  classDef business fill:#3b82f6,stroke:#1d4ed8,color:#fff",
    "  classDef application fill:#10b981,stroke:#059669,color:#fff",
    "  classDef data fill:#6366f1,stroke:#4338ca,color:#fff",
    "  classDef spec fill:#f59e0b,stroke:#d97706,color:#fff",
  ];

  const idMap = new Map<string, string>();
  let counter = 0;

  for (const node of subgraph.nodes) {
    const n = node as Record<string, unknown>;
    const shortId = `N${counter++}`;
    idMap.set(n.id as string, shortId);
    const nodeType = n.nodeType as NodeType;
    const label = sanitizeMermaidLabel(`${n.name}`);
    const style = MERMAID_STYLES[nodeType] || "";
    lines.push(`  ${shortId}["${label}<br/><small>${nodeType}</small>"]${style}`);
  }

  for (const rel of subgraph.relationships) {
    const sourceShort = idMap.get(rel.source_id);
    const targetShort = idMap.get(rel.target_id);
    if (sourceShort && targetShort) {
      lines.push(`  ${sourceShort} -->|${rel.type}| ${targetShort}`);
    }
  }

  return lines.join("\n");
}

function sanitizeMermaidLabel(label: string): string {
  return label.replace(/"/g, "'").replace(/[<>]/g, "");
}
