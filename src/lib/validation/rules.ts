export interface ValidationWarning {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
}

export interface ValidationRule {
  id: string;
  severity: "error" | "warning" | "info";
  description: string;
  cypher: string;
}

export const VALIDATION_RULES: ValidationRule[] = [
  {
    id: "orphan_node",
    severity: "warning",
    description: "Node has no relationships",
    cypher: `
      MATCH (n) WHERE n.valid_to IS NULL
      AND NOT (n)-[]-()
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "api_no_openapi",
    severity: "warning",
    description: "API without API spec",
    cypher: `
      MATCH (n:API) WHERE n.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (n)-[:SPECIFIED_BY]->(s:SpecDocument)
        WHERE s.valid_to IS NULL AND s.spec_type IN ['openapi', 'api_internal', 'api_external']
      }
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "capability_no_service",
    severity: "warning",
    description: "Capability with no realizing service",
    cypher: `
      MATCH (n:BusinessCapability) WHERE n.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (:BusinessService)-[:REALIZES]->(n)
      }
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "service_no_app",
    severity: "warning",
    description: "Service with no realizing application",
    cypher: `
      MATCH (n:BusinessService) WHERE n.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (:Application)-[:REALIZES]->(n)
      }
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "process_no_steps",
    severity: "warning",
    description: "Process with no steps",
    cypher: `
      MATCH (n:BusinessProcess) WHERE n.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (n)-[:COMPOSES]->(:ProcessStep)
      }
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "data_no_erd",
    severity: "warning",
    description: "DataEntity without data spec",
    cypher: `
      MATCH (n:DataEntity) WHERE n.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (n)-[:SPECIFIED_BY]->(s:SpecDocument)
        WHERE s.valid_to IS NULL AND s.spec_type = 'data_model'
      }
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "stale_node",
    severity: "info",
    description: "Node not updated in 6+ months",
    cypher: `
      MATCH (n) WHERE n.valid_to IS NULL
      AND n.updated_at < datetime() - duration('P6M')
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "missing_acceptance_criteria",
    severity: "warning",
    description: "L2+ node missing acceptance criteria",
    cypher: `
      MATCH (n) WHERE n.valid_to IS NULL
      AND n.acceptance_criteria IS NOT NULL
      AND n.acceptance_criteria = ''
      AND NOT labels(n)[0] IN ['SpecDocument', 'DataEntity']
      RETURN n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "capability_no_app_chain",
    severity: "warning",
    description: "Capability not reachable from any application",
    cypher: `
      MATCH (cap:BusinessCapability) WHERE cap.valid_to IS NULL
      AND NOT EXISTS {
        MATCH (:Application)-[:REALIZES]->(:BusinessService)-[:REALIZES]->(cap)
      }
      RETURN cap.id as nodeId, cap.name as nodeName, labels(cap)[0] as nodeType`,
  },
  {
    id: "circular_dependency",
    severity: "error",
    description: "DEPENDS_ON chain forms a cycle",
    cypher: `
      MATCH (n) WHERE n.valid_to IS NULL
      AND EXISTS {
        MATCH p = (n)-[:DEPENDS_ON*2..]->(n)
        WHERE ALL(r IN relationships(p) WHERE r.valid_to IS NULL)
        AND ALL(m IN nodes(p) WHERE m.valid_to IS NULL)
      }
      RETURN DISTINCT n.id as nodeId, n.name as nodeName, labels(n)[0] as nodeType`,
  },
  {
    id: "deprecated_in_use",
    severity: "warning",
    description: "Deprecated node has active incoming relationships from non-deprecated nodes",
    cypher: `
      MATCH (source)-[r]->(target)
      WHERE target.valid_to IS NULL AND target.status = 'deprecated'
      AND r.valid_to IS NULL
      AND source.valid_to IS NULL AND source.status <> 'deprecated'
      AND type(r) IN ['REALIZES', 'SERVES', 'COMPOSES']
      RETURN DISTINCT target.id as nodeId, target.name as nodeName, labels(target)[0] as nodeType`,
  },
  {
    id: "spec_no_parent",
    severity: "warning",
    description: "SpecDocument has no incoming SPECIFIED_BY, TESTED_BY, or IMPLEMENTED_BY",
    cypher: `
      MATCH (s:SpecDocument) WHERE s.valid_to IS NULL
      AND NOT EXISTS {
        MATCH ()-[r:SPECIFIED_BY|TESTED_BY|IMPLEMENTED_BY]->(s)
        WHERE r.valid_to IS NULL
      }
      RETURN s.id as nodeId, s.name as nodeName, labels(s)[0] as nodeType`,
  },
];
