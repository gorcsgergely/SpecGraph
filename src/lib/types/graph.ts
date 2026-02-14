import { z } from "zod/v4";

// ── Base Properties ──────────────────────────────────────────────────────────

export const NodeStatus = z.enum(["draft", "active", "deprecated", "archived"]);
export type NodeStatus = z.infer<typeof NodeStatus>;

export const NodeLayer = z.enum(["business", "application", "spec"]);
export type NodeLayer = z.infer<typeof NodeLayer>;

export const BaseNodeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().default(""),
  status: NodeStatus.default("draft"),
  layer: NodeLayer,
  valid_from: z.string().datetime(),
  valid_to: z.string().datetime().nullable().default(null),
  version: z.number().int().positive().default(1),
  created_by: z.string().default("system"),
  updated_at: z.string().datetime(),
  tags: z.array(z.string()).default([]),
});

export type BaseNode = z.infer<typeof BaseNodeSchema>;

// ── Node Types ───────────────────────────────────────────────────────────────

export const NodeType = z.enum([
  "BusinessCapability",
  "BusinessService",
  "BusinessProcess",
  "ProcessStep",
  "DataEntity",
  "Application",
  "ApplicationComponent",
  "API",
  "SpecDocument",
]);
export type NodeType = z.infer<typeof NodeType>;

// Business Layer

export const BusinessCapabilitySchema = BaseNodeSchema.extend({
  nodeType: z.literal("BusinessCapability"),
  layer: z.literal("business"),
  level: z.number().int().min(1).max(3),
  domain: z.string(),
  owner: z.string(),
  acceptance_criteria: z.string().default(""),
  business_rules: z.string().default(""),
  regulatory_refs: z.array(z.string()).default([]),
});
export type BusinessCapability = z.infer<typeof BusinessCapabilitySchema>;

export const BusinessServiceSchema = BaseNodeSchema.extend({
  nodeType: z.literal("BusinessService"),
  layer: z.literal("business"),
  service_type: z.string(),
  sla_target: z.string().default(""),
  channel: z.array(z.string()).default([]),
  acceptance_criteria: z.string().default(""),
  service_contract: z.string().default(""),
  non_functional_reqs: z.string().default(""),
});
export type BusinessService = z.infer<typeof BusinessServiceSchema>;

export const BusinessProcessSchema = BaseNodeSchema.extend({
  nodeType: z.literal("BusinessProcess"),
  layer: z.literal("business"),
  process_type: z.string(),
  trigger: z.string().default(""),
  outcome: z.string().default(""),
  estimated_duration: z.string().default(""),
  acceptance_criteria: z.string().default(""),
  preconditions: z.string().default(""),
  postconditions: z.string().default(""),
  error_scenarios: z.string().default(""),
});
export type BusinessProcess = z.infer<typeof BusinessProcessSchema>;

export const ProcessStepSchema = BaseNodeSchema.extend({
  nodeType: z.literal("ProcessStep"),
  layer: z.literal("business"),
  sequence_order: z.number().int(),
  step_type: z.enum(["manual", "automated", "decision"]),
  actor: z.string().default(""),
  input_spec: z.string().default(""),
  output_spec: z.string().default(""),
  validation_rules: z.string().default(""),
  code_hints: z.string().default(""),
});
export type ProcessStep = z.infer<typeof ProcessStepSchema>;

export const DataEntitySchema = BaseNodeSchema.extend({
  nodeType: z.literal("DataEntity"),
  layer: z.literal("business"),
  entity_type: z.enum(["master", "transactional", "reference"]),
  sensitivity: z.string().default(""),
  pii: z.boolean().default(false),
  retention_policy: z.string().default(""),
  schema_summary: z.string().default(""),
  validation_rules: z.string().default(""),
  code_hints: z.string().default(""),
});
export type DataEntity = z.infer<typeof DataEntitySchema>;

// Application Layer

export const ApplicationSchema = BaseNodeSchema.extend({
  nodeType: z.literal("Application"),
  layer: z.literal("application"),
  app_type: z.enum(["custom", "cots", "saas", "legacy"]),
  tech_stack: z.array(z.string()).default([]),
  deployment: z.string().default(""),
  repo_url: z.string().default(""),
  architecture_notes: z.string().default(""),
  code_hints: z.string().default(""),
  non_functional_reqs: z.string().default(""),
});
export type Application = z.infer<typeof ApplicationSchema>;

export const ApplicationComponentSchema = BaseNodeSchema.extend({
  nodeType: z.literal("ApplicationComponent"),
  layer: z.literal("application"),
  component_type: z.string(),
  language: z.string().default(""),
  package_path: z.string().default(""),
  repo_path: z.string().default(""),
  interface_spec: z.string().default(""),
  code_hints: z.string().default(""),
  dependencies_notes: z.string().default(""),
  acceptance_criteria: z.string().default(""),
});
export type ApplicationComponent = z.infer<typeof ApplicationComponentSchema>;

export const APISchema = BaseNodeSchema.extend({
  nodeType: z.literal("API"),
  layer: z.literal("application"),
  api_type: z.enum(["rest", "graphql", "grpc", "event"]),
  method: z.string().default(""),
  path: z.string().default(""),
  auth_type: z.string().default(""),
  rate_limit: z.string().default(""),
  request_schema: z.string().default(""),
  response_schema: z.string().default(""),
  error_codes: z.string().default(""),
  code_hints: z.string().default(""),
  example_request: z.string().default(""),
  example_response: z.string().default(""),
});
export type APINode = z.infer<typeof APISchema>;

// Spec Layer

export const SpecTypeEnum = z.enum([
  "openapi",
  "erd",
  "sequence",
  "test_spec",
  "design_doc",
  "implementation_spec",
  "compliance_security",
  "architecture",
  "data_model",
  "state_management",
  "workflow",
  "api_internal",
  "api_external",
  "ui_spec",
  "business_rules",
  "deployment",
]);

export const SpecFormatEnum = z.enum(["markdown", "yaml", "json", "mermaid"]);

export const SpecDocumentSchema = BaseNodeSchema.extend({
  nodeType: z.literal("SpecDocument"),
  layer: z.literal("spec"),
  spec_type: SpecTypeEnum,
  format: SpecFormatEnum,
  content: z.string().default(""),
  content_hash: z.string().default(""),
});
export type SpecDocument = z.infer<typeof SpecDocumentSchema>;

// ── Union type ───────────────────────────────────────────────────────────────

export type GraphNode =
  | BusinessCapability
  | BusinessService
  | BusinessProcess
  | ProcessStep
  | DataEntity
  | Application
  | ApplicationComponent
  | APINode
  | SpecDocument;

export const NodeSchemaMap: Record<NodeType, z.ZodType> = {
  BusinessCapability: BusinessCapabilitySchema,
  BusinessService: BusinessServiceSchema,
  BusinessProcess: BusinessProcessSchema,
  ProcessStep: ProcessStepSchema,
  DataEntity: DataEntitySchema,
  Application: ApplicationSchema,
  ApplicationComponent: ApplicationComponentSchema,
  API: APISchema,
  SpecDocument: SpecDocumentSchema,
};

// ── Relationship Types ───────────────────────────────────────────────────────

export const RelationshipType = z.enum([
  "COMPOSES",
  "REALIZES",
  "SERVES",
  "ACCESSES",
  "FLOWS_TO",
  "TRIGGERS",
  "DEPENDS_ON",
  "SPECIFIED_BY",
  "TESTED_BY",
  "IMPLEMENTED_BY",
]);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  type: RelationshipType,
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
  valid_from: z.string().datetime(),
  valid_to: z.string().datetime().nullable().default(null),
  created_by: z.string().default("system"),
  notes: z.string().default(""),
  access_type: z.enum(["read", "write", "read_write"]).optional(),
});
export type Relationship = z.infer<typeof RelationshipSchema>;

// ── Allowed Relationship Matrix ──────────────────────────────────────────────

export const ALLOWED_RELATIONSHIPS: Record<RelationshipType, Array<[NodeType, NodeType]>> = {
  COMPOSES: [
    ["BusinessCapability", "BusinessCapability"],
    ["BusinessProcess", "ProcessStep"],
    ["Application", "ApplicationComponent"],
  ],
  REALIZES: [
    ["BusinessService", "BusinessCapability"],
    ["Application", "BusinessService"],
    ["ApplicationComponent", "BusinessProcess"],
    ["API", "ApplicationComponent"],
  ],
  SERVES: [
    ["BusinessService", "BusinessCapability"],
    ["API", "BusinessService"],
  ],
  ACCESSES: [
    ["BusinessProcess", "DataEntity"],
    ["ProcessStep", "DataEntity"],
    ["ApplicationComponent", "DataEntity"],
    ["API", "DataEntity"],
  ],
  FLOWS_TO: [
    ["ProcessStep", "ProcessStep"],
    ["Application", "Application"],
    ["ApplicationComponent", "ApplicationComponent"],
  ],
  TRIGGERS: [
    ["ProcessStep", "BusinessProcess"],
    ["API", "BusinessProcess"],
  ],
  DEPENDS_ON: [
    ["Application", "Application"],
    ["ApplicationComponent", "ApplicationComponent"],
    ["API", "API"],
  ],
  SPECIFIED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
    ["SpecDocument", "SpecDocument"],
  ],
  TESTED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
  ],
  IMPLEMENTED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
  ],
};

export function isRelationshipAllowed(
  type: RelationshipType,
  sourceType: NodeType,
  targetType: NodeType
): boolean {
  const allowed = ALLOWED_RELATIONSHIPS[type];
  return allowed.some(([s, t]) => s === sourceType && t === targetType);
}

// ── Layer Color Map ──────────────────────────────────────────────────────────

export const LAYER_COLORS: Record<NodeLayer, string> = {
  business: "#3b82f6",    // blue
  application: "#10b981", // emerald
  spec: "#f59e0b",        // amber
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  BusinessCapability: "#2563eb",
  BusinessService: "#3b82f6",
  BusinessProcess: "#60a5fa",
  ProcessStep: "#93c5fd",
  DataEntity: "#6366f1",
  Application: "#059669",
  ApplicationComponent: "#10b981",
  API: "#34d399",
  SpecDocument: "#f59e0b",
};
