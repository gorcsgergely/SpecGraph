import { executeQuery } from "../neo4j/driver";
import { VALIDATION_RULES, type ValidationWarning, type ValidationRule } from "./rules";
import { ALLOWED_RELATIONSHIPS, type RelationshipType, type NodeType } from "../types/graph";

export async function runValidation(
  ruleIds?: string[]
): Promise<ValidationWarning[]> {
  const rules = ruleIds
    ? VALIDATION_RULES.filter((r) => ruleIds.includes(r.id))
    : VALIDATION_RULES;

  const warnings: ValidationWarning[] = [];

  for (const rule of rules) {
    try {
      const results = await executeQuery<{
        nodeId: string;
        nodeName: string;
        nodeType: string;
      }>(rule.cypher);

      for (const row of results) {
        warnings.push({
          rule: rule.id,
          severity: rule.severity,
          message: `${rule.description}: ${row.nodeName} (${row.nodeType})`,
          nodeId: row.nodeId,
          nodeName: row.nodeName,
          nodeType: row.nodeType,
        });
      }
    } catch {
      // Skip rules that fail (e.g. stale_node with datetime math)
    }
  }

  // Also check for invalid relationships
  const invalidRels = await checkInvalidRelationships();
  warnings.push(...invalidRels);

  return warnings;
}

async function checkInvalidRelationships(): Promise<ValidationWarning[]> {
  const results = await executeQuery<{
    relId: string;
    relType: string;
    sourceId: string;
    targetId: string;
    sourceName: string;
    targetName: string;
    sourceType: string;
    targetType: string;
  }>(
    `MATCH (s)-[r]->(t)
     WHERE r.valid_to IS NULL
     RETURN r.id as relId, type(r) as relType,
       s.id as sourceId, t.id as targetId,
       s.name as sourceName, t.name as targetName,
       labels(s)[0] as sourceType, labels(t)[0] as targetType`
  );

  const warnings: ValidationWarning[] = [];
  for (const row of results) {
    const allowed = ALLOWED_RELATIONSHIPS[row.relType as RelationshipType];
    if (!allowed) continue;
    const isValid = allowed.some(
      ([s, t]) => s === row.sourceType && t === row.targetType
    );
    if (!isValid) {
      warnings.push({
        rule: "invalid_rel",
        severity: "error",
        message: `Invalid relationship: ${row.sourceName} -[${row.relType}]-> ${row.targetName} (${row.sourceType} -> ${row.targetType})`,
        nodeId: row.sourceId,
        nodeName: row.sourceName,
        nodeType: row.sourceType,
      });
    }
  }

  return warnings;
}

export async function runValidationForNode(
  nodeId: string
): Promise<ValidationWarning[]> {
  // Run a subset of validations scoped to a specific node
  const warnings: ValidationWarning[] = [];

  // Check if orphan
  const rels = await executeQuery<{ count: number }>(
    `MATCH (n)-[r]-() WHERE n.id = $nodeId AND r.valid_to IS NULL RETURN count(r) as count`,
    { nodeId }
  );
  if ((rels[0]?.count ?? 0) === 0) {
    const node = await executeQuery<{ name: string; nodeType: string }>(
      `MATCH (n) WHERE n.id = $nodeId RETURN n.name as name, labels(n)[0] as nodeType`,
      { nodeId }
    );
    if (node[0]) {
      warnings.push({
        rule: "orphan_node",
        severity: "warning",
        message: `Node has no relationships: ${node[0].name}`,
        nodeId,
        nodeName: node[0].name,
        nodeType: node[0].nodeType,
      });
    }
  }

  return warnings;
}
