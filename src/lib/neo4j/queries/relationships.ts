import { v4 as uuidv4 } from "uuid";
import { executeQuery, executeWrite } from "../driver";
import { currentPredicate, nowISO } from "../temporal";
import {
  type RelationshipType,
  type Relationship,
  type NodeType,
  isRelationshipAllowed,
} from "../../types/graph";

export async function createRelationship(
  type: RelationshipType,
  sourceId: string,
  targetId: string,
  props: Record<string, unknown> = {}
): Promise<Relationship> {
  // Validate source/target types
  const nodes = await executeQuery<{ sourceType: string; targetType: string }>(
    `MATCH (s), (t)
     WHERE s.id = $sourceId AND ${currentPredicate("s")}
       AND t.id = $targetId AND ${currentPredicate("t")}
     RETURN labels(s)[0] as sourceType, labels(t)[0] as targetType`,
    { sourceId, targetId }
  );

  if (!nodes[0]) throw new Error("Source or target node not found");

  const { sourceType, targetType } = nodes[0];
  if (!isRelationshipAllowed(type, sourceType as NodeType, targetType as NodeType)) {
    throw new Error(
      `Relationship ${type} is not allowed between ${sourceType} and ${targetType}`
    );
  }

  const now = nowISO();
  const relProps = {
    id: uuidv4(),
    valid_from: now,
    valid_to: null,
    created_by: (props.created_by as string) || "system",
    notes: (props.notes as string) || "",
    ...(props.access_type ? { access_type: props.access_type } : {}),
  };

  const result = await executeWrite<{ r: Relationship }>(
    `MATCH (s), (t)
     WHERE s.id = $sourceId AND ${currentPredicate("s")}
       AND t.id = $targetId AND ${currentPredicate("t")}
     CREATE (s)-[r:${type} $props]->(t)
     RETURN properties(r) as r`,
    { sourceId, targetId, props: relProps }
  );

  return { ...result[0].r, type, source_id: sourceId, target_id: targetId };
}

export async function getRelationship(id: string): Promise<(Relationship & { source_id: string; target_id: string }) | null> {
  const result = await executeQuery<{
    r: Record<string, unknown>;
    relType: string;
    sourceId: string;
    targetId: string;
  }>(
    `MATCH (s)-[r]->(t)
     WHERE r.id = $id
     RETURN properties(r) as r, type(r) as relType, s.id as sourceId, t.id as targetId
     LIMIT 1`,
    { id }
  );
  if (!result[0]) return null;
  return {
    ...(result[0].r as unknown as Relationship),
    type: result[0].relType as RelationshipType,
    source_id: result[0].sourceId,
    target_id: result[0].targetId,
  };
}

export async function getNodeRelationships(
  nodeId: string,
  direction: "in" | "out" | "both" = "both"
): Promise<Array<Relationship & { source_id: string; target_id: string; source_name: string; target_name: string; source_type: string; target_type: string }>> {
  const conditions: string[] = [`r.valid_to IS NULL`];
  let matchClause: string;

  if (direction === "out") {
    matchClause = `MATCH (s)-[r]->(t) WHERE s.id = $nodeId`;
  } else if (direction === "in") {
    matchClause = `MATCH (s)-[r]->(t) WHERE t.id = $nodeId`;
  } else {
    matchClause = `MATCH (s)-[r]->(t) WHERE (s.id = $nodeId OR t.id = $nodeId)`;
  }

  const result = await executeQuery<{
    r: Record<string, unknown>;
    relType: string;
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
    sourceType: string;
    targetType: string;
  }>(
    `${matchClause} AND ${conditions.join(" AND ")}
     RETURN properties(r) as r, type(r) as relType,
       s.id as sourceId, t.id as targetId,
       s.name as sourceName, t.name as targetName,
       labels(s)[0] as sourceType, labels(t)[0] as targetType`,
    { nodeId }
  );

  return result.map((row) => ({
    ...(row.r as unknown as Relationship),
    type: row.relType as RelationshipType,
    source_id: row.sourceId,
    target_id: row.targetId,
    source_name: row.sourceName,
    target_name: row.targetName,
    source_type: row.sourceType,
    target_type: row.targetType,
  }));
}

export async function deleteRelationship(id: string): Promise<boolean> {
  const now = nowISO();
  const result = await executeWrite<{ count: number }>(
    `MATCH ()-[r]->() WHERE r.id = $id AND r.valid_to IS NULL
     SET r.valid_to = $now
     RETURN count(r) as count`,
    { id, now }
  );
  return (result[0]?.count ?? 0) > 0;
}
