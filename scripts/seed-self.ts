/**
 * Self-referential seed script: Models SpecGraph itself in its own knowledge graph
 * SpecGraph → Enterprise Architecture Knowledge Graph
 *
 * Run: npx tsx scripts/seed-self.ts
 */

const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "specgraph-dev";

async function seed() {
  const neo4j = await import("neo4j-driver");
  const { v4: uuidv4 } = await import("uuid");

  const driver = neo4j.default.driver(
    NEO4J_URI,
    neo4j.default.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
  );
  const session = driver.session();

  const now = new Date().toISOString();

  function makeNode(
    nodeType: string,
    layer: string,
    props: Record<string, unknown>
  ) {
    const id = uuidv4();
    return {
      id,
      nodeType,
      layer,
      valid_from: now,
      valid_to: null,
      version: 1,
      created_by: "seed-self",
      updated_at: now,
      status: "active",
      tags: [],
      description: "",
      ...props,
    };
  }

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    // ── Create constraints/indexes ──
    console.log("Creating schema...");
    const labels = [
      "BusinessCapability",
      "BusinessService",
      "BusinessProcess",
      "ProcessStep",
      "DataEntity",
      "Application",
      "ApplicationComponent",
      "API",
      "SpecDocument",
    ];
    for (const label of labels) {
      await session.run(
        `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`
      );
      await session.run(
        `CREATE INDEX IF NOT EXISTS FOR (n:${label}) ON (n.valid_to)`
      );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BUSINESS LAYER
    // ══════════════════════════════════════════════════════════════════════════
    console.log("Creating business layer...");

    // ── L1 Capabilities ──

    const archMgmt = makeNode("BusinessCapability", "business", {
      name: "Enterprise Architecture Management",
      description: "Ability to model, track, and govern enterprise architecture artifacts and their relationships across business, application, and specification layers",
      level: 1,
      domain: "Architecture Governance",
      owner: "Chief Architect",
      acceptance_criteria: "Architects can model all ArchiMate-inspired layers, track temporal changes, validate relationships, and export for AI consumption",
      business_rules: "All nodes must belong to a layer; relationships validated against allowed matrix; copy-on-write versioning preserves history",
      regulatory_refs: [],
      tags: ["architecture", "governance", "core"],
    });

    // ── L2 Capabilities ──

    const graphModeling = makeNode("BusinessCapability", "business", {
      name: "Knowledge Graph Modeling",
      description: "Capability to create, read, update, and soft-delete nodes and relationships in a typed knowledge graph with 9 node types and 10 relationship types",
      level: 2,
      domain: "Architecture Governance",
      owner: "Platform Team",
      acceptance_criteria: "All 9 node types can be CRUD-managed; relationships validated against type matrix; copy-on-write versioning on updates",
      business_rules: "Nodes have unique IDs; updates create new versions; deletes are soft (valid_to set); relationship types checked against ALLOWED_RELATIONSHIPS",
      regulatory_refs: [],
      tags: ["graph", "modeling", "crud"],
    });

    const specMgmt = makeNode("BusinessCapability", "business", {
      name: "Specification Management",
      description: "Capability to author, attach, and preview structured specification documents with template support and Mermaid diagram rendering",
      level: 2,
      domain: "Architecture Governance",
      owner: "Platform Team",
      acceptance_criteria: "Specs can be created from 16 types (including 10 templates), edited in Monaco editor, previewed with Mermaid, and attached to any node type",
      business_rules: "Specs attached via SPECIFIED_BY, TESTED_BY, or IMPLEMENTED_BY relationships; template auto-fill on create for template types",
      regulatory_refs: [],
      tags: ["specs", "templates", "authoring"],
    });

    const graphExploration = makeNode("BusinessCapability", "business", {
      name: "Graph Exploration & Visualization",
      description: "Capability to visually explore the architecture graph with force-directed layout, filtering, traversal, search, and time-travel",
      level: 2,
      domain: "Architecture Governance",
      owner: "Platform Team",
      acceptance_criteria: "Interactive canvas graph with drag, zoom, click-to-navigate; filter by layer/type/status; BFS traversal up to N hops; full-text search; temporal snapshots",
      business_rules: "Graph layout cached across navigations; nodes colored by type; temporal queries use valid_from/valid_to predicates",
      regulatory_refs: [],
      tags: ["visualization", "exploration", "search"],
    });

    const qualityAssurance = makeNode("BusinessCapability", "business", {
      name: "Architecture Quality Assurance",
      description: "Capability to validate the knowledge graph for completeness, consistency, and adherence to architectural patterns via advisory rules",
      level: 2,
      domain: "Architecture Governance",
      owner: "Platform Team",
      acceptance_criteria: "Advisory validation rules detect orphan nodes, missing specs, missing realizations, and stale data; zero false positives on well-formed graphs",
      business_rules: "Rules are Cypher-based; severity levels: error, warning, info; can validate full graph or single node",
      regulatory_refs: [],
      tags: ["validation", "quality", "rules"],
    });

    const aiExport = makeNode("BusinessCapability", "business", {
      name: "AI-Ready Export",
      description: "Capability to export subgraphs as structured markdown documents optimized for consumption by AI coding agents",
      level: 2,
      domain: "Architecture Governance",
      owner: "Platform Team",
      acceptance_criteria: "Export includes node details, relationships, spec content, and Mermaid diagrams in a single markdown document; downloadable or JSON response",
      business_rules: "Export follows subgraph traversal from a root node; optionally includes validation warnings",
      regulatory_refs: [],
      tags: ["export", "ai", "markdown"],
    });

    // ── Business Services ──

    const graphService = makeNode("BusinessService", "business", {
      name: "Architecture Graph Service",
      description: "Primary service providing CRUD operations for architecture nodes, relationships, and specs via REST API",
      service_type: "transactional",
      sla_target: "Sub-second response for all CRUD operations",
      channel: ["web"],
      acceptance_criteria: "All API endpoints return correct data with proper error codes; copy-on-write versioning works correctly",
      service_contract: "REST API at /api/* with JSON request/response",
      non_functional_reqs: "Development-mode performance acceptable; single Neo4j instance",
      tags: ["api", "crud", "service"],
    });

    const explorerService = makeNode("BusinessService", "business", {
      name: "Graph Explorer Service",
      description: "Interactive web-based graph visualization and exploration service with real-time filtering and navigation",
      service_type: "interactive",
      sla_target: "60fps canvas rendering; sub-second graph loads",
      channel: ["web"],
      acceptance_criteria: "Force-directed layout renders smoothly; drag/zoom/click-to-navigate work; filters update in real-time; layout persists across navigations",
      service_contract: "Next.js page at /graph with canvas-based rendering",
      non_functional_reqs: "Handles 100+ nodes on screen without frame drops",
      tags: ["explorer", "visualization", "interactive"],
    });

    // ── Business Processes ──

    const nodeManagement = makeNode("BusinessProcess", "business", {
      name: "Node Lifecycle Management",
      description: "Process for creating, updating, and retiring architecture nodes with full version history",
      process_type: "core",
      trigger: "User creates/edits/deletes a node via the UI or API",
      outcome: "Node state updated in Neo4j with version history preserved",
      estimated_duration: "< 1 second",
      acceptance_criteria: "Create sets version=1; update creates new version and migrates relationships; delete soft-closes node and relationships",
      preconditions: "Neo4j running; node type is valid",
      postconditions: "Node exists (or is soft-deleted) in graph; all relationships point to current version",
      error_scenarios: "Invalid node type, missing required fields, node not found on update/delete",
      tags: ["node", "lifecycle", "crud"],
    });

    const specAuthoring = makeNode("BusinessProcess", "business", {
      name: "Specification Authoring",
      description: "Process for creating, editing, and previewing specification documents with template support",
      process_type: "core",
      trigger: "User clicks 'Add Spec' on a node or creates a SpecDocument directly",
      outcome: "Spec document created with template content, editable in Monaco, previewable with Mermaid",
      estimated_duration: "User-driven (seconds to hours)",
      acceptance_criteria: "Template auto-fills on spec type selection; Monaco editor loads content; Mermaid diagrams render in preview",
      preconditions: "Target node exists (if attaching); spec type is valid",
      postconditions: "SpecDocument node created and linked via SPECIFIED_BY/TESTED_BY/IMPLEMENTED_BY",
      error_scenarios: "Template not found for custom types; Mermaid syntax errors in preview",
      tags: ["spec", "authoring", "template"],
    });

    const graphTraversal = makeNode("BusinessProcess", "business", {
      name: "Graph Traversal & Search",
      description: "Process for exploring the knowledge graph via BFS traversal, full-text search, and temporal queries",
      process_type: "supporting",
      trigger: "User navigates graph, enters search query, or selects time-travel date",
      outcome: "Subgraph or search results displayed to user",
      estimated_duration: "< 1 second",
      acceptance_criteria: "BFS returns correct N-hop subgraph; search returns relevant matches; temporal queries respect valid_from/valid_to",
      preconditions: "Graph has nodes; full-text index exists for search",
      postconditions: "Results displayed in UI",
      error_scenarios: "Empty graph, no search results, invalid date for temporal",
      tags: ["traversal", "search", "temporal"],
    });

    // ── Process Steps ──

    const stepCreateNode = makeNode("ProcessStep", "business", {
      name: "Create Node",
      description: "User fills in node form, selects type, submits — system creates node with UUID, version=1, valid_from=now",
      sequence_order: 1,
      step_type: "automated",
      actor: "User → System",
      input_spec: "Node type, name, description, type-specific fields",
      output_spec: "Created node with UUID and version 1",
      validation_rules: "Name required; type-specific fields validated per Zod schema; layer auto-set from node type",
      code_hints: "POST /api/nodes → createNode() in src/lib/neo4j/queries/nodes.ts",
      tags: ["create", "node"],
    });

    const stepUpdateNode = makeNode("ProcessStep", "business", {
      name: "Update Node (Copy-on-Write)",
      description: "System closes current version (valid_to=now), creates new version with incremented version number, migrates all active relationships",
      sequence_order: 2,
      step_type: "automated",
      actor: "System",
      input_spec: "Node ID, updated fields",
      output_spec: "New node version with migrated relationships; old version archived",
      validation_rules: "Node must exist and be current (valid_to IS NULL); updated fields pass Zod validation",
      code_hints: "PUT /api/nodes/:id → updateNode() → migrateRelationships() per rel type",
      tags: ["update", "versioning", "copy-on-write"],
    });

    const stepAttachSpec = makeNode("ProcessStep", "business", {
      name: "Attach Specification",
      description: "User selects template from AttachSpecDialog, system creates SpecDocument with template content and links it to the node",
      sequence_order: 3,
      step_type: "automated",
      actor: "User → System",
      input_spec: "Source node ID, spec type, relationship type (SPECIFIED_BY default)",
      output_spec: "SpecDocument created with template content; relationship created",
      validation_rules: "Relationship type must be SPECIFIED_BY, TESTED_BY, or IMPLEMENTED_BY; spec_type must be valid enum value",
      code_hints: "POST /api/nodes/:id/specs → createNode('SpecDocument') + createRelationship()",
      tags: ["attach", "spec", "template"],
    });

    const stepSearchGraph = makeNode("ProcessStep", "business", {
      name: "Search Graph",
      description: "User enters search query, system runs full-text search across node names and descriptions via Neo4j full-text index",
      sequence_order: 1,
      step_type: "automated",
      actor: "User → System",
      input_spec: "Search query string, optional limit",
      output_spec: "Array of matching nodes with scores",
      validation_rules: "Query must be non-empty string",
      code_hints: "GET /api/search?q=... → fullTextSearch() using CALL db.index.fulltext.queryNodes",
      tags: ["search", "fulltext"],
    });

    const stepExportGraph = makeNode("ProcessStep", "business", {
      name: "Export Subgraph",
      description: "System traverses subgraph from root node, generates structured markdown with nodes, relationships, spec content, and Mermaid diagrams",
      sequence_order: 1,
      step_type: "automated",
      actor: "User → System",
      input_spec: "Root node ID, depth, optional format (json/md), optional includeValidation flag",
      output_spec: "Markdown document or JSON with markdown field",
      validation_rules: "Root node must exist; depth 1-10",
      code_hints: "GET /api/export → traverseSubgraph() → generateMarkdown() + generateMermaid()",
      tags: ["export", "markdown", "mermaid"],
    });

    // ── Data Entities ──

    const graphNodeEntity = makeNode("DataEntity", "business", {
      name: "Graph Node",
      description: "Core data entity representing any node in the knowledge graph — one of 9 types across 3 layers with temporal versioning",
      entity_type: "master",
      sensitivity: "internal",
      pii: false,
      retention_policy: "Indefinite — versioned history preserved via valid_from/valid_to",
      schema_summary: "id (UUID), nodeType, layer, name, description, status, valid_from, valid_to, version, created_by, updated_at, tags[], plus type-specific fields",
      validation_rules: "id unique per label; name required; layer matches nodeType; version positive integer; valid_from required",
      code_hints: "Neo4j node with label = nodeType; types in src/lib/types/graph.ts; Zod schemas per type",
      tags: ["node", "graph", "core"],
    });

    const relationshipEntity = makeNode("DataEntity", "business", {
      name: "Relationship",
      description: "Typed, directed edge between two nodes with temporal versioning — one of 10 types validated against the allowed relationship matrix",
      entity_type: "transactional",
      sensitivity: "internal",
      pii: false,
      retention_policy: "Indefinite — soft-deleted via valid_to timestamp",
      schema_summary: "id (UUID), type (enum), source_id, target_id, valid_from, valid_to, created_by, notes, access_type (optional for ACCESSES)",
      validation_rules: "Type must be in RelationshipType enum; source/target types validated against ALLOWED_RELATIONSHIPS matrix",
      code_hints: "Neo4j relationship with type = RelationshipType; validated in createRelationship()",
      tags: ["relationship", "edge", "graph"],
    });

    const specDocEntity = makeNode("DataEntity", "business", {
      name: "Spec Document",
      description: "Specification document stored as a SpecDocument node with content in markdown/yaml/json/mermaid format, one of 16 spec types",
      entity_type: "transactional",
      sensitivity: "internal",
      pii: false,
      retention_policy: "Indefinite — versioned like all nodes",
      schema_summary: "id, name, description, spec_type (16 values), format (markdown/yaml/json/mermaid), content (string), content_hash, plus base node fields",
      validation_rules: "spec_type must be valid enum; format must be valid enum; content is free-form string",
      code_hints: "Neo4j node with label SpecDocument; 10 template types auto-fill from src/lib/templates/",
      tags: ["spec", "document", "content"],
    });

    // ══════════════════════════════════════════════════════════════════════════
    // APPLICATION LAYER
    // ══════════════════════════════════════════════════════════════════════════
    console.log("Creating application layer...");

    const specGraphApp = makeNode("Application", "application", {
      name: "SpecGraph",
      description: "Enterprise architecture knowledge graph application — Next.js 15 + Neo4j + TypeScript",
      app_type: "custom",
      tech_stack: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS v4", "shadcn/ui", "Neo4j 5", "neo4j-driver v5", "SWR", "Monaco Editor", "Mermaid.js", "react-hook-form", "Zod v4"],
      deployment: "Docker Compose (Neo4j) + next dev (local)",
      repo_url: "https://github.com/gorcsgergely/SpecGraph",
      architecture_notes: "Next.js App Router; server-rendered pages with client components for interactivity; Neo4j as single source of truth; SWR for client-side data fetching; copy-on-write versioning for temporal history",
      code_hints: "Monorepo: src/app/ (pages+API routes), src/lib/ (neo4j, types, templates, validation, export, hooks), src/components/ (graph, nodes, specs, search, export, validation, ui)",
      non_functional_reqs: "Local development tool; single user; Neo4j Community edition (no clustering)",
      tags: ["specgraph", "nextjs", "neo4j", "architecture"],
    });

    // ── Application Components ──

    const appRouter = makeNode("ApplicationComponent", "application", {
      name: "Next.js App Router",
      description: "Server and client page routing with 7 pages: Dashboard, Graph Explorer, Node Detail, Node Editor, Spec Editor, Search, Timeline, Export, Validation",
      component_type: "framework",
      language: "TypeScript",
      package_path: "src/app",
      repo_path: "src/app",
      interface_spec: "File-based routing: page.tsx files under src/app/; API routes under src/app/api/",
      code_hints: "Pages use 'use client' for interactivity; params are Promise<T> in Next.js 15; useSearchParams requires Suspense boundary",
      dependencies_notes: "next 16.1.6, react 19.2.3",
      acceptance_criteria: "All pages render without errors; navigation works; API routes return correct responses",
      tags: ["nextjs", "routing", "pages"],
    });

    const neo4jDriver = makeNode("ApplicationComponent", "application", {
      name: "Neo4j Driver Layer",
      description: "Singleton Neo4j driver with executeQuery/executeWrite helpers, type deserialization via toPlainValue(), and session lifecycle management",
      component_type: "data-access",
      language: "TypeScript",
      package_path: "src/lib/neo4j",
      repo_path: "src/lib/neo4j",
      interface_spec: "executeQuery<T>(cypher, params) for reads; executeWrite<T>(cypher, params) for writes; both handle session open/close and Neo4j type conversion",
      code_hints: "driver.ts (singleton + helpers), queries/nodes.ts (CRUD), queries/relationships.ts (CRUD), queries/traversal.ts (BFS), queries/search.ts (fulltext), temporal.ts (predicates), schema.ts (constraints/indexes)",
      dependencies_notes: "neo4j-driver ^5.28.3; records need 'any' type cast",
      acceptance_criteria: "All queries execute correctly; Neo4j integers, datetimes, and labels deserialized to plain JS; sessions always closed",
      tags: ["neo4j", "driver", "data-access"],
    });

    const graphExplorerComp = makeNode("ApplicationComponent", "application", {
      name: "Graph Explorer",
      description: "Custom canvas-based force-directed graph visualization with drag, zoom, click-to-navigate, layer/type/status filtering, and module-level layout cache",
      component_type: "ui-component",
      language: "TypeScript",
      package_path: "src/components/graph",
      repo_path: "src/components/graph",
      interface_spec: "GraphExplorer component (canvas rendering) + GraphFilters component (sidebar filters); uses refs not state for all mutable data to avoid re-render loops",
      code_hints: "Force simulation in requestAnimationFrame loop; NODE_TYPE_COLORS for styling; layoutCache at module level for position persistence",
      dependencies_notes: "No external graph library — custom canvas implementation",
      acceptance_criteria: "Smooth 60fps rendering; nodes draggable; click navigates to detail; filters update graph in real-time",
      tags: ["graph", "canvas", "visualization"],
    });

    const validationEngine = makeNode("ApplicationComponent", "application", {
      name: "Validation Engine",
      description: "Advisory validation system with Cypher-based rules that check graph completeness and consistency",
      component_type: "engine",
      language: "TypeScript",
      package_path: "src/lib/validation",
      repo_path: "src/lib/validation",
      interface_spec: "rules.ts defines VALIDATION_RULES array; engine.ts runs them against Neo4j and returns ValidationWarning[]",
      code_hints: "8 rules: orphan_node, api_no_openapi, capability_no_service, service_no_app, process_no_steps, data_no_erd, stale_node, missing_acceptance_criteria; use NOT EXISTS {} for null checks",
      dependencies_notes: "Depends on Neo4j driver layer",
      acceptance_criteria: "All rules produce zero false positives on well-formed graphs; severity levels correctly assigned",
      tags: ["validation", "rules", "engine"],
    });

    const exportEngine = makeNode("ApplicationComponent", "application", {
      name: "Export Engine",
      description: "Generates structured markdown and Mermaid diagrams from subgraph traversals for AI agent consumption",
      component_type: "engine",
      language: "TypeScript",
      package_path: "src/lib/export",
      repo_path: "src/lib/export",
      interface_spec: "markdown.ts generates markdown from traversal data; mermaid.ts generates Mermaid graph/ERD/sequence/stateDiagram from relationships",
      code_hints: "Export includes node details, relationship tables, spec content blocks, and embedded Mermaid diagrams",
      dependencies_notes: "Depends on Neo4j driver layer for traversal",
      acceptance_criteria: "Exported markdown is well-formed; Mermaid diagrams render correctly; all node and relationship data included",
      tags: ["export", "markdown", "mermaid"],
    });

    const templateRegistry = makeNode("ApplicationComponent", "application", {
      name: "Template Registry",
      description: "Registry of 10 specification templates with structured markdown content, metadata, and node-type-based suggestions",
      component_type: "library",
      language: "TypeScript",
      package_path: "src/lib/templates",
      repo_path: "src/lib/templates",
      interface_spec: "index.ts exports SPEC_TEMPLATES map, getTemplateContent(), getSuggestedTemplates(), getAllTemplates(); 10 template modules export content + metadata",
      code_hints: "Templates: compliance_security, architecture, data_model, state_management, workflow, api_internal, api_external, ui_spec, business_rules, deployment",
      dependencies_notes: "Pure TypeScript — no external dependencies",
      acceptance_criteria: "All 10 templates load correctly; suggestions match node types; content is valid markdown with Mermaid blocks",
      tags: ["templates", "registry", "specs"],
    });

    // ── APIs ──

    const nodesListAPI = makeNode("API", "application", {
      name: "List/Create Nodes",
      description: "GET lists nodes with filtering (nodeType, layer, status, tags, search, asOf) and pagination; POST creates a new node",
      api_type: "rest",
      method: "GET",
      path: "/api/nodes",
      auth_type: "none (local dev)",
      rate_limit: "none",
      request_schema: "GET: query params (nodeType, layer, status, tags, search, asOf, limit, offset). POST: JSON body with nodeType + type-specific fields",
      response_schema: '{"nodes": [...], "total": number} for GET; node object for POST (201)',
      error_codes: "400: Invalid input on POST; 500: Server error",
      code_hints: "src/app/api/nodes/route.ts → listNodes() / createNode()",
      tags: ["nodes", "list", "create"],
    });

    const nodeCrudAPI = makeNode("API", "application", {
      name: "Node CRUD",
      description: "GET retrieves node by ID; PUT updates via copy-on-write; DELETE soft-deletes",
      api_type: "rest",
      method: "GET",
      path: "/api/nodes/:nodeId",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "GET: optional asOf query param. PUT: JSON body with updated fields. DELETE: no body",
      response_schema: "Node object for GET/PUT; 204 for DELETE",
      error_codes: "404: Node not found; 400: Invalid update; 500: Server error",
      code_hints: "src/app/api/nodes/[nodeId]/route.ts → getNode() / updateNode() / deleteNode()",
      tags: ["node", "crud", "versioning"],
    });

    const nodeSpecsAPI = makeNode("API", "application", {
      name: "Node Specs",
      description: "GET lists specs attached to a node; POST creates a new spec and attaches it via SPECIFIED_BY/TESTED_BY/IMPLEMENTED_BY",
      api_type: "rest",
      method: "POST",
      path: "/api/nodes/:nodeId/specs",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "POST: JSON body with spec fields + relationship_type (default: SPECIFIED_BY)",
      response_schema: "Array of specs with relationship_type for GET; created spec for POST (201)",
      error_codes: "400: Invalid spec or relationship type; 500: Server error",
      code_hints: "src/app/api/nodes/[nodeId]/specs/route.ts → createNode('SpecDocument') + createRelationship()",
      tags: ["specs", "attach", "create"],
    });

    const searchAPI = makeNode("API", "application", {
      name: "Full-Text Search",
      description: "GET searches across node names and descriptions using Neo4j full-text index",
      api_type: "rest",
      method: "GET",
      path: "/api/search",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "Query params: q (required), limit (optional, default 20)",
      response_schema: "Array of matching nodes with search score",
      error_codes: "400: Missing q parameter; 500: Search error",
      code_hints: "src/app/api/search/route.ts → CALL db.index.fulltext.queryNodes('node_fulltext', $query)",
      tags: ["search", "fulltext"],
    });

    const traverseAPI = makeNode("API", "application", {
      name: "Graph Traverse",
      description: "GET performs BFS traversal from a root node to N hops, returns subgraph of nodes and relationships",
      api_type: "rest",
      method: "GET",
      path: "/api/graph/traverse",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "Query params: rootId (required), depth (default 3), asOf (optional temporal)",
      response_schema: '{"nodes": [...], "relationships": [...]}',
      error_codes: "400: Missing rootId; 500: Traversal error",
      code_hints: "src/app/api/graph/traverse/route.ts → traverseSubgraph()",
      tags: ["traverse", "bfs", "subgraph"],
    });

    const validationAPI = makeNode("API", "application", {
      name: "Validation",
      description: "GET runs advisory validation rules against the graph and returns warnings",
      api_type: "rest",
      method: "GET",
      path: "/api/validation",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "Query params: rules (optional, comma-separated), nodeId (optional for single-node validation)",
      response_schema: "Array of ValidationWarning objects with rule, severity, message, nodeId, nodeName, nodeType",
      error_codes: "500: Validation error",
      code_hints: "src/app/api/validation/route.ts → runValidation() from engine.ts",
      tags: ["validation", "rules", "advisory"],
    });

    const exportAPI = makeNode("API", "application", {
      name: "Export",
      description: "GET generates markdown export of a subgraph for AI agent consumption; supports JSON or downloadable .md format",
      api_type: "rest",
      method: "GET",
      path: "/api/export",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "Query params: rootId (required), depth (default 3), format (json/md), includeValidation (boolean)",
      response_schema: 'JSON: {"markdown": "string", "metadata": {...}}. MD: text/markdown file download',
      error_codes: "400: Missing rootId; 500: Export error",
      code_hints: "src/app/api/export/route.ts → traverseSubgraph() → generateMarkdown() + generateMermaid()",
      tags: ["export", "markdown", "ai"],
    });

    const schemaAPI = makeNode("API", "application", {
      name: "Schema Init",
      description: "POST initializes Neo4j constraints (unique ID per label), indexes (valid_to), and full-text search index",
      api_type: "rest",
      method: "POST",
      path: "/api/schema",
      auth_type: "none",
      rate_limit: "none",
      request_schema: "No body required",
      response_schema: '{"message": "Schema initialized", "constraints": [...], "indexes": [...]}',
      error_codes: "500: Schema creation error",
      code_hints: "src/app/api/schema/route.ts → initializeSchema() from schema.ts",
      tags: ["schema", "init", "constraints"],
    });

    // ══════════════════════════════════════════════════════════════════════════
    // SPEC LAYER
    // ══════════════════════════════════════════════════════════════════════════
    console.log("Creating spec documents...");

    const architectureSpec = makeNode("SpecDocument", "spec", {
      name: "SpecGraph Architecture",
      description: "System architecture specification for the SpecGraph application",
      spec_type: "architecture",
      format: "markdown",
      content: `# Architecture Specification — SpecGraph

## 1. Overview

**System:** SpecGraph — Enterprise Architecture Knowledge Graph
**Purpose:** Model, track, and govern enterprise architecture artifacts across business, application, and specification layers
**Architecture Style:** Monolithic Next.js application with Neo4j graph database

## 2. System Layers

\`\`\`mermaid
graph TD
    subgraph Presentation
        Dashboard[Dashboard Page]
        Explorer[Graph Explorer - Canvas]
        NodeDetail[Node Detail / Edit Pages]
        SpecEditor[Spec Editor - Monaco]
        Search[Search Page]
        Timeline[Timeline Page]
        Export[Export Page]
        Validation[Validation Dashboard]
    end
    subgraph API["Next.js API Routes"]
        NodesAPI["/api/nodes"]
        RelsAPI["/api/relationships"]
        SpecsAPI["/api/specs"]
        SearchAPI["/api/search"]
        TraverseAPI["/api/graph/traverse"]
        TemporalAPI["/api/graph/temporal"]
        ExportAPI["/api/export"]
        ValidationAPI["/api/validation"]
        SchemaAPI["/api/schema"]
    end
    subgraph Library
        Queries["Query Functions"]
        Types["Type System + Zod"]
        Templates["Template Registry"]
        ValEngine["Validation Engine"]
        ExpEngine["Export Engine"]
        Hooks["SWR Hooks"]
    end
    subgraph Data
        Neo4j[(Neo4j 5 Community)]
    end

    Dashboard --> NodesAPI
    Dashboard --> ValidationAPI
    Explorer --> TraverseAPI
    NodeDetail --> NodesAPI
    NodeDetail --> SpecsAPI
    SpecEditor --> SpecsAPI
    Search --> SearchAPI
    Timeline --> TemporalAPI
    Export --> ExportAPI
    Validation --> ValidationAPI

    NodesAPI --> Queries
    RelsAPI --> Queries
    SpecsAPI --> Queries
    SearchAPI --> Queries
    TraverseAPI --> Queries
    TemporalAPI --> Queries
    ExportAPI --> ExpEngine
    ValidationAPI --> ValEngine
    ExpEngine --> Queries
    ValEngine --> Queries
    Queries --> Neo4j
    Hooks --> NodesAPI
    Hooks --> SearchAPI
    Hooks --> TraverseAPI
    Hooks --> ValidationAPI
\`\`\`

## 3. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Neo4j 5 Community | Native graph model for architecture relationships; Cypher for traversals |
| Framework | Next.js 15 App Router | File-based routing, server components, API routes in one project |
| Graph rendering | Custom canvas (no library) | Full control over force layout; refs-based to avoid React re-render loops |
| Versioning | Copy-on-write | Preserves full history; old relationships migrated to new version automatically |
| Spec editing | Monaco Editor | Full-featured code editor with syntax highlighting for markdown/yaml/json |
| Diagram preview | Mermaid.js | Widely supported; renders in markdown; multiple diagram types |
| Data fetching | SWR | Stale-while-revalidate for snappy UI with background refresh |
| Validation | Zod v4 | Runtime type checking for API inputs; schema-first approach |
| Styling | Tailwind v4 + shadcn/ui | Utility-first CSS with pre-built accessible components |

## 4. Data Flow

\`\`\`
User Action → React Component → SWR Hook → fetch() → API Route → Query Function → Neo4j Driver → Neo4j
                                                                                      ↓
User sees ← React re-render ← SWR cache update ← JSON response ← toPlainValue() ← Cypher result
\`\`\`

## 5. Temporal Model

All nodes and relationships carry \`valid_from\` and \`valid_to\` timestamps:
- **Current data:** \`valid_to IS NULL\`
- **Historical data:** \`valid_from <= asOf AND (valid_to IS NULL OR valid_to > asOf)\`
- **Copy-on-write:** Old node gets \`valid_to = now\`; new node created with \`version + 1\`; all active relationships migrated

---
*AI Agent Guidance: SpecGraph is a monolithic Next.js app — all code in one repo. API routes are the boundary between client and server. Neo4j is the single source of truth. Use SWR hooks for data fetching in components. Follow existing patterns in queries/ for new Cypher operations.*`,
      content_hash: "",
      tags: ["architecture", "specgraph", "overview"],
    });

    const dataModelSpec = makeNode("SpecDocument", "spec", {
      name: "SpecGraph Data Model",
      description: "Neo4j graph schema with 9 node types, 10 relationship types, and temporal versioning",
      spec_type: "data_model",
      format: "markdown",
      content: `# Data Model Specification — SpecGraph

## 1. Overview

**Domain:** Enterprise Architecture Knowledge Graph
**Storage:** Neo4j 5 Community (graph database)
**Naming Convention:** camelCase for properties, PascalCase for labels, UPPER_SNAKE for relationship types

## 2. Node Types (Labels)

### Base Properties (all nodes)

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| id | String (UUID) | Yes | Generated | Unique identifier |
| name | String | Yes | — | Display name |
| description | String | No | "" | Free-form description |
| status | Enum | Yes | "draft" | draft, active, deprecated, archived |
| layer | Enum | Yes | — | business, application, spec |
| valid_from | DateTime | Yes | NOW() | Version start time |
| valid_to | DateTime | No | null | Version end time (null = current) |
| version | Integer | Yes | 1 | Version number, incremented on update |
| created_by | String | Yes | "system" | Creator identifier |
| updated_at | DateTime | Yes | NOW() | Last update timestamp |
| tags | String[] | No | [] | Free-form tags |

### Business Layer (5 types)

| Label | Additional Properties |
|-------|---------------------|
| BusinessCapability | level (1-3), domain, owner, acceptance_criteria, business_rules, regulatory_refs[] |
| BusinessService | service_type, sla_target, channel[], acceptance_criteria, service_contract, non_functional_reqs |
| BusinessProcess | process_type, trigger, outcome, estimated_duration, acceptance_criteria, preconditions, postconditions, error_scenarios |
| ProcessStep | sequence_order, step_type (manual/automated/decision), actor, input_spec, output_spec, validation_rules, code_hints |
| DataEntity | entity_type (master/transactional/reference), sensitivity, pii (boolean), retention_policy, schema_summary, validation_rules, code_hints |

### Application Layer (3 types)

| Label | Additional Properties |
|-------|---------------------|
| Application | app_type (custom/cots/saas/legacy), tech_stack[], deployment, repo_url, architecture_notes, code_hints, non_functional_reqs |
| ApplicationComponent | component_type, language, package_path, repo_path, interface_spec, code_hints, dependencies_notes, acceptance_criteria |
| API | api_type (rest/graphql/grpc/event), method, path, auth_type, rate_limit, request_schema, response_schema, error_codes, code_hints, example_request, example_response |

### Spec Layer (1 type)

| Label | Additional Properties |
|-------|---------------------|
| SpecDocument | spec_type (16 values), format (markdown/yaml/json/mermaid), content, content_hash |

## 3. Relationship Types

\`\`\`mermaid
graph LR
    BC[BusinessCapability] -->|COMPOSES| BC
    BP[BusinessProcess] -->|COMPOSES| PS[ProcessStep]
    App[Application] -->|COMPOSES| AC[ApplicationComponent]
    BS[BusinessService] -->|REALIZES| BC
    App -->|REALIZES| BS
    AC -->|REALIZES| BP
    API -->|REALIZES| AC
    BS -->|SERVES| BC
    API -->|SERVES| BS
    BP -->|ACCESSES| DE[DataEntity]
    PS -->|ACCESSES| DE
    AC -->|ACCESSES| DE
    API -->|ACCESSES| DE
    PS -->|FLOWS_TO| PS
    App -->|FLOWS_TO| App
    AC -->|FLOWS_TO| AC
    PS -->|TRIGGERS| BP
    API -->|TRIGGERS| BP
    App -->|DEPENDS_ON| App
    AC -->|DEPENDS_ON| AC
    API -->|DEPENDS_ON| API
    Any[Any Node] -->|SPECIFIED_BY| SD[SpecDocument]
    Any -->|TESTED_BY| SD
    Any -->|IMPLEMENTED_BY| SD
\`\`\`

| Relationship | Properties |
|-------------|-----------|
| All types | id (UUID), valid_from, valid_to, created_by, notes |
| ACCESSES | + access_type (read/write/read_write) |

## 4. Indexes & Constraints

| Type | Label/Rel | Property | Purpose |
|------|-----------|----------|---------|
| UNIQUE constraint | All 9 labels | id | Node identity |
| Index | All 9 labels | valid_to | Temporal queries |
| Full-text index | All 9 labels | name, description | Search |

---
*AI Agent Guidance: Neo4j has no fixed schema — labels and properties are flexible. The type system is enforced in application code via Zod schemas. Always include valid_from/valid_to in queries for temporal correctness. Use ALLOWED_RELATIONSHIPS matrix before creating relationships.*`,
      content_hash: "",
      tags: ["data-model", "neo4j", "schema"],
    });

    const apiSpec = makeNode("SpecDocument", "spec", {
      name: "SpecGraph Internal API",
      description: "REST API contract for all SpecGraph endpoints",
      spec_type: "api_internal",
      format: "markdown",
      content: `# Internal API Specification — SpecGraph

## 1. Overview

**Service:** SpecGraph Next.js API Routes
**Base Path:** /api
**Protocol:** REST (JSON)
**Authentication:** None (local development tool)

## 2. Endpoints

### Nodes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/nodes | List nodes with filtering and pagination |
| POST | /api/nodes | Create a new node |
| GET | /api/nodes/:nodeId | Get node by ID (supports asOf) |
| PUT | /api/nodes/:nodeId | Update node (copy-on-write) |
| DELETE | /api/nodes/:nodeId | Soft-delete node |
| GET | /api/nodes/:nodeId/relationships | Get node's relationships |
| GET | /api/nodes/:nodeId/specs | Get attached specs |
| POST | /api/nodes/:nodeId/specs | Create and attach spec |
| GET | /api/nodes/:nodeId/history | Get version history |

### Relationships

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/relationships | List all active relationships |
| GET | /api/relationships/:relId | Get relationship by ID |
| DELETE | /api/relationships/:relId | Soft-delete relationship |

### Specs

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/specs/:specId | Get spec by ID |
| PUT | /api/specs/:specId | Update spec (copy-on-write) |
| DELETE | /api/specs/:specId | Soft-delete spec |

### Graph Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/search?q=... | Full-text search |
| GET | /api/graph/traverse?rootId=...&depth=3 | BFS subgraph traversal |
| GET | /api/graph/temporal?asOf=...&rootId=... | Time-travel query |
| GET | /api/export?rootId=...&format=md | Markdown export |
| GET | /api/validation | Run validation rules |
| POST | /api/schema | Initialize DB schema |

## 3. Common Patterns

**Pagination:** \`?limit=20&offset=0\`
**Temporal:** \`?asOf=2025-01-01T00:00:00Z\`
**Filtering:** \`?nodeType=API&layer=application&status=active&tags=core\`

## 4. Error Format

All errors return: \`{"error": "Error message string"}\` with appropriate HTTP status code.

---
*AI Agent Guidance: All routes are in src/app/api/. Follow existing patterns for new endpoints. Use executeQuery for reads, executeWrite for writes. Always handle errors with try/catch returning NextResponse.json with error status.*`,
      content_hash: "",
      tags: ["api", "rest", "endpoints"],
    });

    const deploymentSpec = makeNode("SpecDocument", "spec", {
      name: "SpecGraph Deployment",
      description: "Local development setup and deployment configuration",
      spec_type: "deployment",
      format: "markdown",
      content: `# Deployment Specification — SpecGraph

## 1. Overview

**Application:** SpecGraph
**Environment:** Local development
**Deployment Model:** Docker Compose (Neo4j) + Node.js dev server

## 2. Infrastructure

### Services

| Component | Type | Image/Runtime | Port |
|-----------|------|---------------|------|
| Neo4j | Docker container | neo4j:5-community | 7474 (HTTP), 7687 (Bolt) |
| SpecGraph | Node.js process | next dev | 3000 |

### Neo4j Configuration

- **Auth:** neo4j / specgraph-dev
- **Plugins:** APOC enabled
- **Volume:** neo4j_data:/data (persistent)

### Prerequisites

- Node.js (via Homebrew: \`eval "$(/opt/homebrew/bin/brew shellenv)"\`)
- Docker / Docker Compose
- npm

## 3. Setup Commands

\`\`\`bash
# 1. Start Neo4j
docker compose up -d

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Initialize schema (requires dev server running)
npm run db:schema

# 5. Seed example data
npm run seed          # Banking example (31 nodes, 53 rels)
npm run seed:self     # Self-referential (SpecGraph itself)
\`\`\`

## 4. Health Checks

| Check | How | Expected |
|-------|-----|----------|
| Neo4j | http://localhost:7474 | Neo4j Browser UI |
| Neo4j Bolt | bolt://localhost:7687 | Connection accepted |
| SpecGraph | http://localhost:3000 | Dashboard page |
| API | http://localhost:3000/api/nodes | JSON response |

## 5. Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NEO4J_URI | Bolt connection URI | bolt://localhost:7687 |
| NEO4J_USER | Neo4j username | neo4j |
| NEO4J_PASSWORD | Neo4j password | specgraph-dev |

---
*AI Agent Guidance: This is a local development tool. No production deployment, no CI/CD, no containers for the app itself. Neo4j runs in Docker; the app runs via next dev. Always run eval brew shellenv before npm commands on macOS.*`,
      content_hash: "",
      tags: ["deployment", "docker", "local"],
    });

    const workflowSpec = makeNode("SpecDocument", "spec", {
      name: "Node Update Workflow",
      description: "Copy-on-write versioning workflow for node updates",
      spec_type: "workflow",
      format: "markdown",
      content: `# Workflow Specification — Node Update (Copy-on-Write)

## 1. Context

**Process:** Copy-on-Write Node Update
**Trigger:** PUT /api/nodes/:nodeId with updated fields
**Outcome:** New node version created with incremented version; old version archived; all relationships migrated
**SLA:** < 500ms including relationship migration

## 2. Actors

| Actor | Type | Role |
|-------|------|------|
| User | External | Submits update via UI/API |
| API Route | System | Validates and delegates |
| updateNode() | System | Orchestrates copy-on-write |
| migrateRelationships() | System | Moves relationships to new version |
| Neo4j | Database | Executes Cypher transactions |

## 3. Workflow Steps

### Step 1: Validate Update
- **Actor:** API Route
- **Input:** Node ID + updated fields
- **Action:** Verify node exists and is current (valid_to IS NULL)
- **Next:** Step 2

### Step 2: Close Current Version
- **Actor:** updateNode()
- **Action:** SET valid_to = now on current node
- **Output:** Old node marked as historical
- **Next:** Step 3

### Step 3: Create New Version
- **Actor:** updateNode()
- **Action:** CREATE new node with new UUID, version + 1, valid_from = now, merged properties
- **Output:** New node with incremented version
- **Next:** Step 4

### Step 4: Migrate Relationships
- **Actor:** migrateRelationships()
- **Action:** For each active relationship (valid_to IS NULL) connected to old node:
  1. Close old relationship (SET valid_to = now)
  2. Create new relationship of same type pointing to/from new node
  3. Copy all relationship properties
- **Business Rules:**
  - Handles both outgoing and incoming relationships
  - Iterates per relationship type (Cypher can't dynamically create rel types)
  - Preserves access_type and notes from original relationships
- **Output:** All relationships now point to new node version
- **Next:** Step 5

### Step 5: Return New Version
- **Actor:** API Route
- **Action:** Return the new node to the caller
- **Output:** Updated node with new ID and incremented version

## 4. State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Validating : PUT request received
    Validating --> ClosingOld : Node found & current
    Validating --> Error : Node not found
    ClosingOld --> CreatingNew : valid_to set on old
    CreatingNew --> MigratingRels : New version created
    MigratingRels --> Done : All rels migrated
    Done --> [*] : Return new node
    Error --> [*] : Return 404
\`\`\`

## 5. Error Handling

| Error | At Step | Handling |
|-------|---------|----------|
| Node not found | Step 1 | Return 404 |
| Node already archived | Step 1 | Return 404 (valid_to not null) |
| Cypher execution error | Step 2-4 | Transaction rollback, return 500 |

---
*AI Agent Guidance: The copy-on-write pattern is central to SpecGraph's versioning. All node updates go through this flow. Relationship migration is per-type because Cypher doesn't support dynamic relationship types in CREATE. Always use executeWrite for the full transaction.*`,
      content_hash: "",
      tags: ["workflow", "versioning", "copy-on-write"],
    });

    const stateSpec = makeNode("SpecDocument", "spec", {
      name: "Node Status State Machine",
      description: "State management for node status lifecycle",
      spec_type: "state_management",
      format: "markdown",
      content: `# State Management Specification — Node Status

## 1. Overview

**Entity:** Graph Node (all types)
**Purpose:** Track node lifecycle from draft through active use to deprecation and archival

## 2. States

| Status | Description | Who Sets It |
|--------|-------------|-------------|
| draft | Initial state, work in progress | System (on create) |
| active | Production-ready, in use | User |
| deprecated | Marked for removal, still visible | User |
| archived | No longer active, hidden from default views | User |

## 3. State Flow

\`\`\`mermaid
stateDiagram-v2
    [*] --> draft : Node created
    draft --> active : Activate
    draft --> archived : Archive (skip active)
    active --> deprecated : Deprecate
    active --> archived : Archive
    deprecated --> archived : Archive
    deprecated --> active : Reactivate
    archived --> draft : Restore
\`\`\`

## 4. Behavior

- Default list views filter to \`status IN ['draft', 'active', 'deprecated']\`
- Archived nodes excluded from graph explorer unless explicitly filtered
- Validation rules only check nodes where \`valid_to IS NULL\` (current version)
- Status changes are just field updates — they go through copy-on-write like any other update

---
*AI Agent Guidance: Status is a simple enum field, not a formal state machine in code. The transitions above are conventions, not enforced programmatically. Any status can be set to any other status via the API.*`,
      content_hash: "",
      tags: ["state", "status", "lifecycle"],
    });

    const businessRulesSpec = makeNode("SpecDocument", "spec", {
      name: "Relationship Validation Rules",
      description: "Business rules for the allowed relationship type matrix",
      spec_type: "business_rules",
      format: "markdown",
      content: `# Business Rules Specification — Relationship Validation

## 1. Overview

**Domain:** Knowledge Graph Relationship Constraints
**Owner:** Platform Team
**Purpose:** Ensure architectural consistency by restricting which node types can be connected by which relationship types

## 2. Decision Table: Allowed Relationships

| Relationship Type | Source → Target | Meaning |
|-------------------|----------------|---------|
| COMPOSES | BusinessCapability → BusinessCapability | Capability decomposition |
| COMPOSES | BusinessProcess → ProcessStep | Process has steps |
| COMPOSES | Application → ApplicationComponent | App has components |
| REALIZES | BusinessService → BusinessCapability | Service realizes capability |
| REALIZES | Application → BusinessService | App realizes service |
| REALIZES | ApplicationComponent → BusinessProcess | Component realizes process |
| REALIZES | API → ApplicationComponent | API realizes component |
| SERVES | BusinessService → BusinessCapability | Service serves capability |
| SERVES | API → BusinessService | API serves service |
| ACCESSES | BusinessProcess → DataEntity | Process accesses data |
| ACCESSES | ProcessStep → DataEntity | Step accesses data |
| ACCESSES | ApplicationComponent → DataEntity | Component accesses data |
| ACCESSES | API → DataEntity | API accesses data |
| FLOWS_TO | ProcessStep → ProcessStep | Step sequence |
| FLOWS_TO | Application → Application | App integration flow |
| FLOWS_TO | ApplicationComponent → ApplicationComponent | Component flow |
| TRIGGERS | ProcessStep → BusinessProcess | Step triggers process |
| TRIGGERS | API → BusinessProcess | API triggers process |
| DEPENDS_ON | Application → Application | App dependency |
| DEPENDS_ON | ApplicationComponent → ApplicationComponent | Component dependency |
| DEPENDS_ON | API → API | API dependency |
| SPECIFIED_BY | Any → SpecDocument | Node specified by spec |
| TESTED_BY | Any (except SpecDocument) → SpecDocument | Node tested by spec |
| IMPLEMENTED_BY | Any (except SpecDocument) → SpecDocument | Node implemented by spec |

## 3. Validation Logic

\`\`\`
function isRelationshipAllowed(type, sourceType, targetType):
  return ALLOWED_RELATIONSHIPS[type].some(([s, t]) => s === sourceType && t === targetType)
\`\`\`

Applied in \`createRelationship()\` before persisting to Neo4j.

## 4. ACCESSES Special Rule

The ACCESSES relationship has an additional \`access_type\` property:
- \`read\` — Read-only access
- \`write\` — Write-only access
- \`read_write\` — Both read and write

---
*AI Agent Guidance: The matrix is defined in ALLOWED_RELATIONSHIPS in src/lib/types/graph.ts. Check isRelationshipAllowed() before creating any relationship. The matrix is the single source of truth for what connects to what.*`,
      content_hash: "",
      tags: ["business-rules", "relationships", "validation"],
    });

    const uiSpecDoc = makeNode("SpecDocument", "spec", {
      name: "Graph Explorer UI",
      description: "UI specification for the canvas-based graph explorer",
      spec_type: "ui_spec",
      format: "markdown",
      content: `# UI Specification — Graph Explorer

## 1. Overview

**Screen:** Graph Explorer (/graph)
**Purpose:** Visualize and navigate the architecture knowledge graph interactively
**Entry Points:** Sidebar "Graph Explorer" link, dashboard "Open Graph" button

## 2. Layout

### Desktop

\`\`\`
┌─────────────────────────────────────────────────────┐
│  Header: "Graph Explorer"              [New Node]    │
├──────────┬──────────────────────────────────────────┤
│          │                                            │
│  Filters │  Canvas (force-directed graph)             │
│  (240px) │                                            │
│          │  ┌─────┐     ┌─────┐                      │
│  Layer   │  │Node │────▶│Node │                      │
│  □ Biz   │  └─────┘     └─────┘                      │
│  □ App   │       ╲                                    │
│  □ Spec  │        ╲  ┌─────┐                         │
│          │         ╲▶│Node │                          │
│  Type    │           └─────┘                          │
│  □ Each  │                                            │
│          │                                            │
│  Status  │                                            │
│  □ Each  │                                            │
│          │                                            │
├──────────┴──────────────────────────────────────────┤
│  Node count: 31                                      │
└─────────────────────────────────────────────────────┘
\`\`\`

## 3. Interactions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Pan | Click + drag on canvas | Move viewport |
| Zoom | Scroll wheel | Zoom in/out centered on cursor |
| Drag node | Click + drag on node | Move node, pause simulation |
| Select node | Click node | Highlight, show tooltip |
| Navigate to detail | Click node name/label | router.push(/graph/:nodeId) |
| Filter | Toggle checkbox | Show/hide matching nodes instantly |
| Hover | Mouse over node | Show name + type tooltip |

## 4. Rendering

- Nodes: Colored circles by NODE_TYPE_COLORS, sized by connection count
- Edges: Gray lines with arrow heads, labeled with relationship type
- Layout: Force-directed with charge repulsion + link attraction
- Performance: All mutable state in refs, not React state; requestAnimationFrame loop; module-level layoutCache

## 5. States

| State | Visual |
|-------|--------|
| Loading | "Loading..." text |
| Empty graph | "No nodes yet" + "New Node" CTA |
| Loaded | Full graph rendered |
| Filtered | Subset of nodes visible, others hidden |

---
*AI Agent Guidance: The graph explorer is a custom canvas implementation — no D3 or vis.js. All animation state lives in React refs to avoid re-render loops. The layoutCache is module-level to persist positions across page navigations. See GraphExplorer.tsx and GraphFilters.tsx.*`,
      content_hash: "",
      tags: ["ui", "graph", "canvas", "explorer"],
    });

    // ── Create all nodes ──
    console.log("Inserting nodes...");
    const allNodes = [
      // Business layer
      archMgmt, graphModeling, specMgmt, graphExploration, qualityAssurance, aiExport,
      graphService, explorerService,
      nodeManagement, specAuthoring, graphTraversal,
      stepCreateNode, stepUpdateNode, stepAttachSpec, stepSearchGraph, stepExportGraph,
      graphNodeEntity, relationshipEntity, specDocEntity,
      // Application layer
      specGraphApp,
      appRouter, neo4jDriver, graphExplorerComp, validationEngine, exportEngine, templateRegistry,
      nodesListAPI, nodeCrudAPI, nodeSpecsAPI, searchAPI, traverseAPI, validationAPI, exportAPI, schemaAPI,
      // Spec layer
      architectureSpec, dataModelSpec, apiSpec, deploymentSpec,
      workflowSpec, stateSpec, businessRulesSpec, uiSpecDoc,
    ];

    for (const node of allNodes) {
      const { nodeType, ...props } = node;
      await session.run(
        `CREATE (n:${nodeType} $props)`,
        { props }
      );
    }

    // ── Create relationships ──
    console.log("Creating relationships...");

    const rels: Array<{ type: string; from: string; to: string; props?: Record<string, unknown> }> = [
      // Capability decomposition
      { type: "COMPOSES", from: archMgmt.id, to: graphModeling.id },
      { type: "COMPOSES", from: archMgmt.id, to: specMgmt.id },
      { type: "COMPOSES", from: archMgmt.id, to: graphExploration.id },
      { type: "COMPOSES", from: archMgmt.id, to: qualityAssurance.id },
      { type: "COMPOSES", from: archMgmt.id, to: aiExport.id },

      // Services realize capabilities
      { type: "REALIZES", from: graphService.id, to: archMgmt.id },
      { type: "REALIZES", from: graphService.id, to: graphModeling.id },
      { type: "REALIZES", from: graphService.id, to: specMgmt.id },
      { type: "REALIZES", from: explorerService.id, to: graphExploration.id },
      { type: "REALIZES", from: graphService.id, to: qualityAssurance.id },
      { type: "REALIZES", from: explorerService.id, to: aiExport.id },

      // Services serve capabilities
      { type: "SERVES", from: graphService.id, to: archMgmt.id },
      { type: "SERVES", from: explorerService.id, to: archMgmt.id },

      // Application realizes services
      { type: "REALIZES", from: specGraphApp.id, to: graphService.id },
      { type: "REALIZES", from: specGraphApp.id, to: explorerService.id },

      // Application decomposes into components
      { type: "COMPOSES", from: specGraphApp.id, to: appRouter.id },
      { type: "COMPOSES", from: specGraphApp.id, to: neo4jDriver.id },
      { type: "COMPOSES", from: specGraphApp.id, to: graphExplorerComp.id },
      { type: "COMPOSES", from: specGraphApp.id, to: validationEngine.id },
      { type: "COMPOSES", from: specGraphApp.id, to: exportEngine.id },
      { type: "COMPOSES", from: specGraphApp.id, to: templateRegistry.id },

      // Components realize processes
      { type: "REALIZES", from: neo4jDriver.id, to: nodeManagement.id },
      { type: "REALIZES", from: templateRegistry.id, to: specAuthoring.id },
      { type: "REALIZES", from: neo4jDriver.id, to: graphTraversal.id },

      // APIs realize components
      { type: "REALIZES", from: nodesListAPI.id, to: neo4jDriver.id },
      { type: "REALIZES", from: nodeCrudAPI.id, to: neo4jDriver.id },
      { type: "REALIZES", from: nodeSpecsAPI.id, to: neo4jDriver.id },
      { type: "REALIZES", from: searchAPI.id, to: neo4jDriver.id },
      { type: "REALIZES", from: traverseAPI.id, to: neo4jDriver.id },
      { type: "REALIZES", from: validationAPI.id, to: validationEngine.id },
      { type: "REALIZES", from: exportAPI.id, to: exportEngine.id },
      { type: "REALIZES", from: schemaAPI.id, to: neo4jDriver.id },

      // Process decomposition
      { type: "COMPOSES", from: nodeManagement.id, to: stepCreateNode.id },
      { type: "COMPOSES", from: nodeManagement.id, to: stepUpdateNode.id },
      { type: "COMPOSES", from: specAuthoring.id, to: stepAttachSpec.id },
      { type: "COMPOSES", from: graphTraversal.id, to: stepSearchGraph.id },
      { type: "COMPOSES", from: graphTraversal.id, to: stepExportGraph.id },

      // Step flows
      { type: "FLOWS_TO", from: stepCreateNode.id, to: stepUpdateNode.id },

      // Data access
      { type: "ACCESSES", from: neo4jDriver.id, to: graphNodeEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: neo4jDriver.id, to: relationshipEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: neo4jDriver.id, to: specDocEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: nodesListAPI.id, to: graphNodeEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: nodeCrudAPI.id, to: graphNodeEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: nodeSpecsAPI.id, to: specDocEntity.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: searchAPI.id, to: graphNodeEntity.id, props: { access_type: "read" } },
      { type: "ACCESSES", from: traverseAPI.id, to: graphNodeEntity.id, props: { access_type: "read" } },
      { type: "ACCESSES", from: exportAPI.id, to: graphNodeEntity.id, props: { access_type: "read" } },

      // Component dependencies
      { type: "DEPENDS_ON", from: validationEngine.id, to: neo4jDriver.id },
      { type: "DEPENDS_ON", from: exportEngine.id, to: neo4jDriver.id },

      // Specs attached to nodes
      { type: "SPECIFIED_BY", from: specGraphApp.id, to: architectureSpec.id },
      { type: "SPECIFIED_BY", from: specGraphApp.id, to: deploymentSpec.id },
      { type: "SPECIFIED_BY", from: graphNodeEntity.id, to: dataModelSpec.id },
      { type: "SPECIFIED_BY", from: relationshipEntity.id, to: dataModelSpec.id },
      { type: "SPECIFIED_BY", from: specDocEntity.id, to: dataModelSpec.id },
      { type: "SPECIFIED_BY", from: nodesListAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: nodeCrudAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: nodeSpecsAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: searchAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: traverseAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: validationAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: exportAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: schemaAPI.id, to: apiSpec.id },
      { type: "SPECIFIED_BY", from: nodeManagement.id, to: workflowSpec.id },
      { type: "SPECIFIED_BY", from: graphNodeEntity.id, to: stateSpec.id },
      { type: "SPECIFIED_BY", from: graphExplorerComp.id, to: uiSpecDoc.id },
      { type: "SPECIFIED_BY", from: graphModeling.id, to: businessRulesSpec.id },
      { type: "SPECIFIED_BY", from: relationshipEntity.id, to: businessRulesSpec.id },
    ];

    for (const rel of rels) {
      const relId = uuidv4();
      const relProps: Record<string, unknown> = {
        id: relId,
        valid_from: now,
        valid_to: null,
        created_by: "seed-self",
        notes: "",
      };
      if (rel.props) {
        Object.assign(relProps, rel.props);
      }
      await session.run(
        `MATCH (a), (b)
         WHERE a.id = $fromId AND b.id = $toId
         CREATE (a)-[r:${rel.type} $props]->(b)`,
        { fromId: rel.from, toId: rel.to, props: relProps }
      );
    }

    console.log(
      `\nSeed complete! Created ${allNodes.length} nodes and ${rels.length} relationships.`
    );
    console.log("\nSpecGraph models itself:");
    console.log(`  Enterprise Arch Mgmt:  ${archMgmt.id}`);
    console.log(`  SpecGraph App:         ${specGraphApp.id}`);
    console.log(`  Architecture Spec:     ${architectureSpec.id}`);
    console.log(`  Data Model Spec:       ${dataModelSpec.id}`);
    console.log(`  API Spec:              ${apiSpec.id}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
