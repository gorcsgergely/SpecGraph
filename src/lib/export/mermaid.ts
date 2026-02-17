import type { TraversalResult } from "../neo4j/queries/traversal";
import type { GraphNode, NodeType } from "../types/graph";

const MERMAID_STYLES: Record<NodeType, string> = {
  BusinessCapability: ":::business",
  BusinessService: ":::business",
  BusinessProcess: ":::business",
  ProcessStep: ":::business",
  DataEntity: ":::data",
  GlossaryTerm: ":::glossary",
  Application: ":::application",
  ApplicationComponent: ":::application",
  API: ":::application",
  DataStore: ":::datastore",
  DataObject: ":::datastore",
  DataField: ":::datastore",
  SpecDocument: ":::spec",
};

export function generateMermaidFromSubgraph(subgraph: TraversalResult): string {
  const lines: string[] = [
    "graph TD",
    "  classDef business fill:#f9db25,stroke:#d4b820,color:#333",
    "  classDef application fill:#8fbce6,stroke:#6a9ec0,color:#fff",
    "  classDef data fill:#f9db25,stroke:#d4b820,color:#333",
    "  classDef glossary fill:#c898fc,stroke:#a070d0,color:#333",
    "  classDef datastore fill:#b9cf3b,stroke:#94a830,color:#333",
    "  classDef spec fill:#6366f1,stroke:#4f46e5,color:#fff",
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
