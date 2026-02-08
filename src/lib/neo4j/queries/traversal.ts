import { executeQuery } from "../driver";
import { currentPredicate, asOfPredicate } from "../temporal";
import type { GraphNode, Relationship, RelationshipType } from "../../types/graph";

export interface TraversalResult {
  nodes: GraphNode[];
  relationships: Array<{
    id: string;
    type: RelationshipType;
    source_id: string;
    target_id: string;
    notes: string;
    access_type?: string;
  }>;
}

export async function traverseSubgraph(
  rootId: string,
  depth: number = 3,
  asOf?: string
): Promise<TraversalResult> {
  const nodePredicate = asOf ? asOfPredicate("n", "asOf") : currentPredicate("n");
  const relPredicate = asOf ? "r.valid_from <= $asOf AND (r.valid_to IS NULL OR r.valid_to > $asOf)" : "r.valid_to IS NULL";

  const params: Record<string, unknown> = { rootId, depth };
  if (asOf) params.asOf = asOf;

  // Get all nodes within depth hops
  const nodeResults = await executeQuery<{ n: GraphNode }>(
    `MATCH (root) WHERE root.id = $rootId AND ${asOf ? asOfPredicate("root", "asOf") : currentPredicate("root")}
     CALL {
       WITH root
       MATCH path = (root)-[*0..${depth}]-(n)
       WHERE ALL(r IN relationships(path) WHERE ${relPredicate})
         AND ALL(node IN nodes(path) WHERE ${asOf ? asOfPredicate("node", "asOf") : currentPredicate("node")})
       RETURN DISTINCT n
     }
     RETURN n`,
    params
  );

  const nodes = nodeResults.map((r) => r.n);
  const nodeIds = nodes.map((n) => (n as Record<string, unknown>).id as string);

  if (nodeIds.length === 0) return { nodes: [], relationships: [] };

  // Get all relationships between these nodes
  const relResults = await executeQuery<{
    relId: string;
    relType: string;
    sourceId: string;
    targetId: string;
    notes: string;
    access_type: string | null;
  }>(
    `MATCH (s)-[r]->(t)
     WHERE s.id IN $nodeIds AND t.id IN $nodeIds AND ${relPredicate}
     RETURN r.id as relId, type(r) as relType,
       s.id as sourceId, t.id as targetId,
       r.notes as notes, r.access_type as access_type`,
    { ...params, nodeIds }
  );

  const relationships = relResults.map((r) => ({
    id: r.relId,
    type: r.relType as RelationshipType,
    source_id: r.sourceId,
    target_id: r.targetId,
    notes: r.notes || "",
    ...(r.access_type ? { access_type: r.access_type } : {}),
  }));

  return { nodes, relationships };
}
