import { v4 as uuidv4 } from "uuid";
import neo4j from "neo4j-driver";
import { executeQuery, executeWrite } from "../driver";
import { currentPredicate, asOfPredicate, nowISO } from "../temporal";
import type { NodeType, GraphNode } from "../../types/graph";

// ── Create ───────────────────────────────────────────────────────────────────

export async function createNode(
  nodeType: NodeType,
  props: Record<string, unknown>
): Promise<GraphNode> {
  const now = nowISO();
  const id = uuidv4();
  const nodeProps = {
    ...props,
    id,
    nodeType,
    valid_from: now,
    valid_to: null,
    version: 1,
    updated_at: now,
    created_by: props.created_by || "system",
    tags: props.tags || [],
  };

  const result = await executeWrite<{ n: GraphNode }>(
    `CREATE (n:${nodeType} $props) RETURN n`,
    { props: nodeProps }
  );
  return result[0].n;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getNode(id: string, asOf?: string): Promise<GraphNode | null> {
  const predicate = asOf ? asOfPredicate("n", "asOf") : currentPredicate("n");
  const params: Record<string, unknown> = { id };
  if (asOf) params.asOf = asOf;

  const result = await executeQuery<{ n: GraphNode }>(
    `MATCH (n) WHERE n.id = $id AND ${predicate} RETURN n LIMIT 1`,
    params
  );
  return result[0]?.n ?? null;
}

export async function getNodeHistory(id: string): Promise<GraphNode[]> {
  // Get all versions of a node by matching on name + nodeType (since id changes on copy-on-write)
  // First, get the current/latest node to find its name
  const current = await executeQuery<{ n: GraphNode }>(
    `MATCH (n) WHERE n.id = $id RETURN n LIMIT 1`,
    { id }
  );
  if (!current[0]) return [];

  const node = current[0].n;
  const result = await executeQuery<{ n: GraphNode }>(
    `MATCH (n:${(node as Record<string, unknown>).nodeType})
     WHERE n.name = $name
     RETURN n ORDER BY n.version DESC`,
    { name: (node as Record<string, unknown>).name }
  );
  return result.map((r) => r.n);
}

// ── List ─────────────────────────────────────────────────────────────────────

export async function listNodes(options: {
  nodeType?: NodeType;
  layer?: string;
  status?: string;
  tags?: string[];
  search?: string;
  asOf?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ nodes: GraphNode[]; total: number }> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};
  const predicate = options.asOf
    ? asOfPredicate("n", "asOf")
    : currentPredicate("n");
  conditions.push(predicate);
  if (options.asOf) params.asOf = options.asOf;

  const label = options.nodeType || "";

  if (options.layer) {
    conditions.push("n.layer = $layer");
    params.layer = options.layer;
  }
  if (options.status) {
    conditions.push("n.status = $status");
    params.status = options.status;
  }
  if (options.tags?.length) {
    conditions.push("ANY(t IN $tags WHERE t IN n.tags)");
    params.tags = options.tags;
  }
  if (options.search) {
    conditions.push("(n.name CONTAINS $search OR n.description CONTAINS $search)");
    params.search = options.search;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit || 100;
  const skip = options.offset || 0;

  const countResult = await executeQuery<{ count: number }>(
    `MATCH (n${label ? `:${label}` : ""}) ${where} RETURN count(n) as count`,
    params
  );
  const total = countResult[0]?.count ?? 0;

  const result = await executeQuery<{ n: GraphNode }>(
    `MATCH (n${label ? `:${label}` : ""}) ${where}
     RETURN n ORDER BY n.name SKIP $skip LIMIT $limit`,
    { ...params, skip: neo4jInt(skip), limit: neo4jInt(limit) }
  );

  return { nodes: result.map((r) => r.n), total };
}

// ── Update (Copy-on-Write) ───────────────────────────────────────────────────

export async function updateNode(
  id: string,
  updates: Record<string, unknown>
): Promise<GraphNode | null> {
  const now = nowISO();

  // 1. Close old version
  await executeWrite(
    `MATCH (n) WHERE n.id = $id AND ${currentPredicate("n")}
     SET n.valid_to = $now`,
    { id, now }
  );

  // 2. Get the old node data
  const oldResult = await executeQuery<{ n: GraphNode }>(
    `MATCH (n) WHERE n.id = $id AND n.valid_to = $now RETURN n LIMIT 1`,
    { id, now }
  );
  if (!oldResult[0]) return null;
  const oldNode = oldResult[0].n as Record<string, unknown>;

  // 3. Create new version
  const newId = uuidv4();
  const nodeType = oldNode.nodeType as string;
  const newProps = {
    ...oldNode,
    ...updates,
    id: newId,
    version: ((oldNode.version as number) || 1) + 1,
    valid_from: now,
    valid_to: null,
    updated_at: now,
  };

  const result = await executeWrite<{ n: GraphNode }>(
    `CREATE (n:${nodeType} $props) RETURN n`,
    { props: newProps }
  );

  // 4. Migrate active relationships to new version
  await migrateRelationships(id, newId, now);

  return result[0]?.n ?? null;
}

async function migrateRelationships(
  oldNodeId: string,
  newNodeId: string,
  now: string
): Promise<void> {
  // Get all active outgoing relationships
  const outgoing = await executeQuery<{
    relType: string;
    targetId: string;
    props: Record<string, unknown>;
  }>(
    `MATCH (source)-[r]->(target)
     WHERE source.id = $oldId AND r.valid_to IS NULL
     RETURN type(r) as relType, target.id as targetId, properties(r) as props`,
    { oldId: oldNodeId }
  );

  for (const rel of outgoing) {
    // Close old relationship
    await executeWrite(
      `MATCH (source)-[r:${rel.relType}]->(target)
       WHERE source.id = $oldId AND target.id = $targetId AND r.valid_to IS NULL
       SET r.valid_to = $now`,
      { oldId: oldNodeId, targetId: rel.targetId, now }
    );
    // Create new relationship
    const newRelProps = {
      ...rel.props,
      id: uuidv4(),
      valid_from: now,
      valid_to: null,
    };
    await executeWrite(
      `MATCH (source), (target)
       WHERE source.id = $newId AND target.id = $targetId AND ${currentPredicate("target")}
       CREATE (source)-[r:${rel.relType} $props]->(target)`,
      { newId: newNodeId, targetId: rel.targetId, props: newRelProps }
    );
  }

  // Get all active incoming relationships
  const incoming = await executeQuery<{
    relType: string;
    sourceId: string;
    props: Record<string, unknown>;
  }>(
    `MATCH (source)-[r]->(target)
     WHERE target.id = $oldId AND r.valid_to IS NULL
     RETURN type(r) as relType, source.id as sourceId, properties(r) as props`,
    { oldId: oldNodeId }
  );

  for (const rel of incoming) {
    await executeWrite(
      `MATCH (source)-[r:${rel.relType}]->(target)
       WHERE source.id = $sourceId AND target.id = $oldId AND r.valid_to IS NULL
       SET r.valid_to = $now`,
      { sourceId: rel.sourceId, oldId: oldNodeId, now }
    );
    const newRelProps = {
      ...rel.props,
      id: uuidv4(),
      valid_from: now,
      valid_to: null,
    };
    await executeWrite(
      `MATCH (source), (target)
       WHERE source.id = $sourceId AND target.id = $newId AND ${currentPredicate("source")}
       CREATE (source)-[r:${rel.relType} $props]->(target)`,
      { sourceId: rel.sourceId, newId: newNodeId, props: newRelProps }
    );
  }
}

// ── Delete (Soft) ────────────────────────────────────────────────────────────

export async function deleteNode(id: string): Promise<boolean> {
  const now = nowISO();

  // Soft-delete the node
  const result = await executeWrite<{ count: number }>(
    `MATCH (n) WHERE n.id = $id AND ${currentPredicate("n")}
     SET n.valid_to = $now
     WITH n
     MATCH (n)-[r]-() WHERE r.valid_to IS NULL
     SET r.valid_to = $now
     RETURN count(n) as count`,
    { id, now }
  );
  return (result[0]?.count ?? 0) > 0;
}

// Helper — neo4j integer
function neo4jInt(n: number) {
  return neo4j.int(n);
}
