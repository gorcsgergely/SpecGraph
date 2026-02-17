import type { TraversalResult } from "../neo4j/queries/traversal";
import type { GraphNode, NodeType } from "../types/graph";
import type { ValidationWarning } from "../validation/rules";
import { generateMermaidFromSubgraph } from "./mermaid";

interface ExportOptions {
  rootName: string;
  depth: number;
  includeSpecs?: boolean;
  includeValidation?: boolean;
}

export function generateMarkdownExport(
  subgraph: TraversalResult,
  options: ExportOptions,
  warnings?: ValidationWarning[]
): string {
  const sections: string[] = [];
  const now = new Date().toISOString();

  // Header
  sections.push(`# SpecGraph Export: ${options.rootName}`);
  sections.push(
    `> Exported: ${now} | Depth: ${options.depth} | Nodes: ${subgraph.nodes.length} | Relationships: ${subgraph.relationships.length}\n`
  );

  // Graph Overview (Mermaid)
  sections.push("## Graph Overview\n");
  sections.push("```mermaid");
  sections.push(generateMermaidFromSubgraph(subgraph));
  sections.push("```\n");

  // Nodes grouped by layer
  sections.push("## Nodes\n");
  const grouped = groupNodesByLayer(subgraph.nodes);

  for (const [layer, nodes] of Object.entries(grouped)) {
    if (nodes.length === 0) continue;
    sections.push(`### ${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer\n`);

    for (const node of nodes) {
      const n = node as Record<string, unknown>;
      sections.push(`#### ${n.name} (${n.nodeType})\n`);
      sections.push(`- **ID:** ${n.id}`);
      sections.push(`- **Status:** ${n.status}`);
      sections.push(`- **Version:** ${n.version}`);
      if (n.description) sections.push(`- **Description:** ${n.description}`);

      // Type-specific properties
      const skipKeys = new Set([
        "id", "name", "description", "status", "layer", "nodeType",
        "valid_from", "valid_to", "version", "created_by", "updated_at", "tags",
      ]);
      for (const [key, value] of Object.entries(n)) {
        if (skipKeys.has(key) || !value || (typeof value === "string" && !value.trim())) continue;
        if (Array.isArray(value) && value.length === 0) continue;
        const formatted = Array.isArray(value) ? value.join(", ") : String(value);
        sections.push(`- **${formatKey(key)}:** ${formatted}`);
      }
      sections.push("");
    }
  }

  // Relationships table
  sections.push("## Relationships\n");
  sections.push("| From | Relationship | To | Notes |");
  sections.push("|------|-------------|-----|-------|");

  const nodeNameMap = new Map<string, string>();
  for (const node of subgraph.nodes) {
    const n = node as Record<string, unknown>;
    nodeNameMap.set(n.id as string, n.name as string);
  }

  for (const rel of subgraph.relationships) {
    const from = nodeNameMap.get(rel.source_id) || rel.source_id;
    const to = nodeNameMap.get(rel.target_id) || rel.target_id;
    const notes = rel.notes || (rel.access_type ? `access: ${rel.access_type}` : "");
    sections.push(`| ${from} | ${rel.type} | ${to} | ${notes} |`);
  }
  sections.push("");

  // Attached Specifications
  if (options.includeSpecs !== false) {
    const specs = subgraph.nodes.filter(
      (n) => (n as Record<string, unknown>).nodeType === "SpecDocument"
    );
    if (specs.length > 0) {
      sections.push("## Attached Specifications\n");
      for (const spec of specs) {
        const s = spec as Record<string, unknown>;
        sections.push(`### ${s.name} (${s.spec_type}, ${s.format})\n`);
        if (s.content) {
          const format = s.format as string;
          const lang = format === "mermaid" ? "mermaid" : format === "yaml" ? "yaml" : format === "json" ? "json" : "markdown";
          sections.push(`\`\`\`${lang}`);
          sections.push(s.content as string);
          sections.push("```\n");
        }
      }
    }
  }

  // Validation Warnings
  if (options.includeValidation !== false && warnings?.length) {
    sections.push("## Validation Warnings\n");
    for (const w of warnings) {
      const icon = w.severity === "error" ? "❌" : w.severity === "warning" ? "⚠️" : "ℹ️";
      sections.push(`- ${icon} **${w.rule}**: ${w.message}`);
    }
    sections.push("");
  }

  return sections.join("\n");
}

function groupNodesByLayer(nodes: GraphNode[]): Record<string, GraphNode[]> {
  const groups: Record<string, GraphNode[]> = {
    business: [],
    application: [],
    technology: [],
    spec: [],
  };
  for (const node of nodes) {
    const n = node as Record<string, unknown>;
    const layer = (n.layer as string) || "spec";
    if (!groups[layer]) groups[layer] = [];
    groups[layer].push(node);
  }
  return groups;
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
