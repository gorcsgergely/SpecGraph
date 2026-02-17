import { z } from "zod/v4";

// ── Base Properties ──────────────────────────────────────────────────────────

export const NodeStatus = z.enum(["draft", "active", "deprecated", "archived"]);
export type NodeStatus = z.infer<typeof NodeStatus>;

export const NodeLayer = z.enum(["business", "application", "data", "spec"]);
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
  "GlossaryTerm",
  "Application",
  "ApplicationComponent",
  "API",
  "DataStore",
  "DataObject",
  "DataField",
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

export const GdprCategory = z.enum(["none", "personal", "sensitive", "special_category"]);
export type GdprCategory = z.infer<typeof GdprCategory>;

export const PrivacyClass = z.enum(["public", "internal", "confidential", "restricted"]);
export type PrivacyClass = z.infer<typeof PrivacyClass>;

export const GlossaryTermSchema = BaseNodeSchema.extend({
  nodeType: z.literal("GlossaryTerm"),
  layer: z.literal("business"),
  canonical_name: z.string().min(1),
  domain: z.string().default(""),
  owner: z.string().default(""),
  steward: z.string().default(""),
  synonyms: z.array(z.string()).default([]),
  definition: z.string().default(""),
  data_type: z.string().default(""),
  allowed_values: z.string().default(""),
  gdpr_category: GdprCategory.default("none"),
  privacy_class: PrivacyClass.default("internal"),
  dq_rules: z.string().default(""),
  regulatory_refs: z.array(z.string()).default([]),
  code_hints: z.string().default(""),
});
export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>;

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
});
export type APINode = z.infer<typeof APISchema>;

// Data Layer (physical data)

export const DataStoreSchema = BaseNodeSchema.extend({
  nodeType: z.literal("DataStore"),
  layer: z.literal("data"),
  store_type: z.enum(["database", "cache", "message_broker", "file_store", "data_lake"]),
  technology: z.string().default(""),
  environment: z.string().default(""),
  connection_info: z.string().default(""),
  code_hints: z.string().default(""),
});
export type DataStore = z.infer<typeof DataStoreSchema>;

export const DataObjectSchema = BaseNodeSchema.extend({
  nodeType: z.literal("DataObject"),
  layer: z.literal("data"),
  object_type: z.enum(["table", "view", "collection", "topic", "type", "class", "schema", "payload"]),
  physical_name: z.string().min(1),
  schema_definition: z.string().default(""),
  format: z.string().default(""),
  code_hints: z.string().default(""),
});
export type DataObject = z.infer<typeof DataObjectSchema>;

export const DataFieldSchema = BaseNodeSchema.extend({
  nodeType: z.literal("DataField"),
  layer: z.literal("data"),
  field_type: z.string().min(1),
  physical_name: z.string().min(1),
  nullable: z.boolean().default(false),
  default_value: z.string().default(""),
  constraints: z.string().default(""),
  pii: z.boolean().default(false),
  sensitivity: z.string().default(""),
  code_hints: z.string().default(""),
});
export type DataField = z.infer<typeof DataFieldSchema>;

// Spec Layer

export const SpecTypeEnum = z.enum([
  "openapi",
  "sequence",
  "test_spec",
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
  "business_requirements",
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
  | GlossaryTerm
  | Application
  | ApplicationComponent
  | APINode
  | DataStore
  | DataObject
  | DataField
  | SpecDocument;

export const NodeSchemaMap: Record<NodeType, z.ZodType> = {
  BusinessCapability: BusinessCapabilitySchema,
  BusinessService: BusinessServiceSchema,
  BusinessProcess: BusinessProcessSchema,
  ProcessStep: ProcessStepSchema,
  DataEntity: DataEntitySchema,
  GlossaryTerm: GlossaryTermSchema,
  Application: ApplicationSchema,
  ApplicationComponent: ApplicationComponentSchema,
  API: APISchema,
  DataStore: DataStoreSchema,
  DataObject: DataObjectSchema,
  DataField: DataFieldSchema,
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
  "ASSOCIATED_WITH",
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
    ["DataStore", "DataObject"],
    ["DataObject", "DataField"],
    ["Application", "DataStore"],
  ],
  REALIZES: [
    ["BusinessService", "BusinessCapability"],
    ["Application", "BusinessService"],
    ["ApplicationComponent", "BusinessProcess"],
    ["API", "ApplicationComponent"],
    ["DataObject", "DataEntity"],
  ],
  SERVES: [
    ["BusinessService", "BusinessCapability"],
    ["API", "BusinessService"],
  ],
  ACCESSES: [
    ["BusinessProcess", "DataEntity"],
    ["ProcessStep", "DataEntity"],
    ["API", "DataEntity"],
    ["ApplicationComponent", "DataObject"],
    ["API", "DataObject"],
  ],
  FLOWS_TO: [
    ["ProcessStep", "ProcessStep"],
    ["Application", "Application"],
    ["ApplicationComponent", "ApplicationComponent"],
    ["DataObject", "DataObject"],
  ],
  TRIGGERS: [
    ["ProcessStep", "BusinessProcess"],
    ["API", "BusinessProcess"],
  ],
  DEPENDS_ON: [
    ["Application", "Application"],
    ["ApplicationComponent", "ApplicationComponent"],
    ["API", "API"],
    ["ApplicationComponent", "DataStore"],
  ],
  ASSOCIATED_WITH: [
    ["GlossaryTerm", "DataEntity"],
    ["GlossaryTerm", "BusinessProcess"],
    ["GlossaryTerm", "BusinessService"],
    ["GlossaryTerm", "BusinessCapability"],
    ["GlossaryTerm", "ProcessStep"],
    ["GlossaryTerm", "API"],
    ["GlossaryTerm", "ApplicationComponent"],
    ["GlossaryTerm", "Application"],
    ["GlossaryTerm", "GlossaryTerm"],
    ["GlossaryTerm", "DataStore"],
    ["GlossaryTerm", "DataObject"],
    ["GlossaryTerm", "DataField"],
  ],
  SPECIFIED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["GlossaryTerm", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
    ["DataStore", "SpecDocument"],
    ["DataObject", "SpecDocument"],
    ["DataField", "SpecDocument"],
    ["SpecDocument", "SpecDocument"],
  ],
  TESTED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["GlossaryTerm", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
    ["DataStore", "SpecDocument"],
    ["DataObject", "SpecDocument"],
    ["DataField", "SpecDocument"],
  ],
  IMPLEMENTED_BY: [
    ["BusinessCapability", "SpecDocument"],
    ["BusinessService", "SpecDocument"],
    ["BusinessProcess", "SpecDocument"],
    ["ProcessStep", "SpecDocument"],
    ["DataEntity", "SpecDocument"],
    ["GlossaryTerm", "SpecDocument"],
    ["Application", "SpecDocument"],
    ["ApplicationComponent", "SpecDocument"],
    ["API", "SpecDocument"],
    ["DataStore", "SpecDocument"],
    ["DataObject", "SpecDocument"],
    ["DataField", "SpecDocument"],
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
  business: "#f9db25",    // ArchiMate business yellow
  application: "#8fbce6", // ArchiMate application blue
  data: "#a3be30",        // ArchiMate technology green
  spec: "#6366f1",        // indigo (documentation)
};

export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  // Business layer — ArchiMate yellow (#f9db25)
  BusinessCapability: "#f5aa27",  // ArchiMate Capability (strategy orange)
  BusinessService: "#f9db25",     // ArchiMate BusinessService
  BusinessProcess: "#f7d024",     // ArchiMate BusinessProcess (darker variant)
  ProcessStep: "#fbe54a",         // lighter yellow variant
  DataEntity: "#f9db25",          // ArchiMate BusinessObject (business passive)
  // Motivation — ArchiMate purple (#c898fc)
  GlossaryTerm: "#c898fc",        // ArchiMate Meaning/Motivation
  // Application layer — ArchiMate blue (#8fbce6)
  Application: "#7aade0",         // darker blue variant
  ApplicationComponent: "#8fbce6", // ArchiMate ApplicationComponent
  API: "#a4cdef",                 // lighter blue variant
  // Technology / physical data — ArchiMate green (#b9cf3b)
  DataStore: "#a3be30",           // darker green variant
  DataObject: "#b9cf3b",          // ArchiMate technology green
  DataField: "#c8da5e",           // lighter green variant
  // Spec layer — indigo (documentation, rendered as outline)
  SpecDocument: "#6366f1",        // indigo-500
};
