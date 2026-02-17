/**
 * Seed script: Creates a banking example graph
 * Retail Lending → Mortgage Origination → LoanOS → APIs
 * Now includes specs using all template types
 *
 * Run: npx tsx scripts/seed.ts
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
      created_by: "seed",
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
      "GlossaryTerm",
      "Application",
      "ApplicationComponent",
      "API",
      "DataStore",
      "DataObject",
      "DataField",
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

    // ── Business Layer ──
    console.log("Creating business layer...");

    const retailLending = makeNode("BusinessCapability", "business", {
      name: "Retail Lending",
      description: "End-to-end consumer lending capabilities including mortgages, personal loans, and auto loans",
      level: 1,
      domain: "Consumer Banking",
      owner: "VP Lending",
      acceptance_criteria: "All consumer lending products can be originated, serviced, and collected through supported channels",
      business_rules: "All loans must comply with TILA, RESPA, and state-specific regulations",
      regulatory_refs: ["TILA", "RESPA", "ECOA", "HMDA"],
      tags: ["lending", "consumer", "core"],
    });

    const mortgageOrigination = makeNode("BusinessCapability", "business", {
      name: "Mortgage Origination",
      description: "Capability to originate residential mortgage loans from application through funding",
      level: 2,
      domain: "Consumer Banking",
      owner: "Director Mortgage Ops",
      acceptance_criteria: "Mortgage applications can be received, underwritten, approved, and funded within SLA targets",
      business_rules: "DTI max 43%, LTV max 97% for conventional, credit score min 620",
      regulatory_refs: ["TILA", "RESPA", "QM Rule"],
      tags: ["mortgage", "origination"],
    });

    const mortgageService = makeNode("BusinessService", "business", {
      name: "Mortgage Application Service",
      description: "Accepts and processes residential mortgage applications across all channels",
      service_type: "transactional",
      sla_target: "Application decision within 3 business days",
      channel: ["web", "mobile", "branch", "broker"],
      acceptance_criteria: "Applications received and validated with pre-qualification response within 4 hours",
      service_contract: "24/7 availability for digital channels, 99.9% uptime",
      non_functional_reqs: "Max 2s response time for application submission, support 500 concurrent applications",
      tags: ["mortgage", "application"],
    });

    const applicationProcess = makeNode("BusinessProcess", "business", {
      name: "Mortgage Application Process",
      description: "End-to-end process for receiving and processing a mortgage application",
      process_type: "core",
      trigger: "Customer submits mortgage application",
      outcome: "Application accepted and queued for underwriting, or rejected with reasons",
      estimated_duration: "15 minutes (digital), 45 minutes (branch)",
      acceptance_criteria: "All required data collected, validated, and initial eligibility confirmed",
      preconditions: "Customer identity verified, property identified",
      postconditions: "Application record created, documents uploaded, credit pulled",
      error_scenarios: "Incomplete data, credit bureau timeout, duplicate application detected",
      tags: ["mortgage", "process"],
    });

    // Process Steps
    const step1 = makeNode("ProcessStep", "business", {
      name: "Capture Borrower Information",
      description: "Collect borrower demographics, employment, income, and asset information",
      sequence_order: 1,
      step_type: "automated",
      actor: "Applicant / Loan Officer",
      input_spec: "Borrower SSN, name, address, employer, income docs",
      output_spec: "Validated borrower profile",
      validation_rules: "SSN format, age >= 18, income > 0",
      code_hints: "Use /api/v1/applications POST with BorrowerInfo schema",
      tags: ["capture", "borrower"],
    });

    const step2 = makeNode("ProcessStep", "business", {
      name: "Pull Credit Report",
      description: "Request tri-merge credit report from bureau",
      sequence_order: 2,
      step_type: "automated",
      actor: "System",
      input_spec: "Borrower SSN, name, DOB",
      output_spec: "Credit report with scores from all 3 bureaus",
      validation_rules: "Credit score >= 300 and <= 850",
      code_hints: "Call CreditBureau adapter, timeout 30s, retry 2x",
      tags: ["credit", "bureau"],
    });

    const step3 = makeNode("ProcessStep", "business", {
      name: "Calculate Eligibility",
      description: "Run automated eligibility rules based on credit, income, and property",
      sequence_order: 3,
      step_type: "automated",
      actor: "System",
      input_spec: "Credit report, income data, property details, loan amount",
      output_spec: "Eligibility decision (eligible/ineligible/refer) with reasons",
      validation_rules: "DTI <= 43%, LTV <= 97%, credit score >= 620",
      code_hints: "Eligibility engine in eligibility-service, rules in Drools",
      tags: ["eligibility", "rules"],
    });

    const step4 = makeNode("ProcessStep", "business", {
      name: "Generate Pre-Qualification Letter",
      description: "If eligible, generate pre-qualification letter with conditional terms",
      sequence_order: 4,
      step_type: "decision",
      actor: "System",
      input_spec: "Eligibility result, loan terms",
      output_spec: "Pre-qualification letter PDF or rejection notice",
      validation_rules: "Letter must include APR, loan amount, and conditions",
      code_hints: "PDF generation via doc-service, template: mortgage-prequel-v3",
      tags: ["letter", "prequalification"],
    });

    // Data Entities
    const loanApplication = makeNode("DataEntity", "business", {
      name: "Loan Application",
      description: "Core data entity representing a mortgage loan application",
      entity_type: "transactional",
      sensitivity: "high",
      pii: true,
      retention_policy: "7 years after loan closure or rejection",
      schema_summary: "application_id, borrower_id, property_id, loan_amount, loan_type, status, created_at, updated_at",
      validation_rules: "loan_amount > 0, loan_type IN (conventional, fha, va, usda)",
      code_hints: "Table: loan_applications, ORM: LoanApplication model",
      tags: ["loan", "application", "core"],
    });

    const borrowerProfile = makeNode("DataEntity", "business", {
      name: "Borrower Profile",
      description: "Personal and financial information about a loan applicant",
      entity_type: "master",
      sensitivity: "critical",
      pii: true,
      retention_policy: "7 years after last interaction",
      schema_summary: "borrower_id, ssn, first_name, last_name, dob, email, phone, employer, annual_income, credit_score",
      validation_rules: "ssn is unique, email is valid, annual_income >= 0",
      code_hints: "Table: borrowers, encrypted fields: ssn, dob",
      tags: ["borrower", "pii", "master"],
    });

    const creditReport = makeNode("DataEntity", "business", {
      name: "Credit Report",
      description: "Credit bureau report for a borrower",
      entity_type: "transactional",
      sensitivity: "high",
      pii: true,
      retention_policy: "Duration of application + 25 months",
      schema_summary: "report_id, borrower_id, bureau, score, report_date, raw_data_ref",
      validation_rules: "score between 300-850, bureau IN (experian, equifax, transunion)",
      code_hints: "Table: credit_reports, raw XML stored in S3",
      tags: ["credit", "bureau", "report"],
    });

    // ── Application Layer ──
    console.log("Creating application layer...");

    const loanOS = makeNode("Application", "application", {
      name: "LoanOS",
      description: "Core loan origination system handling mortgage applications end-to-end",
      app_type: "custom",
      tech_stack: ["TypeScript", "Node.js", "PostgreSQL", "Redis", "Kafka"],
      deployment: "Kubernetes on AWS EKS",
      repo_url: "https://github.com/acmebank/loan-os",
      architecture_notes: "Microservices architecture with event sourcing for loan state transitions",
      code_hints: "Monorepo with packages: api-gateway, application-service, eligibility-service, doc-service",
      non_functional_reqs: "99.95% uptime, < 500ms p99 latency, 1000 TPS",
      tags: ["loanos", "origination", "core"],
    });

    const appService = makeNode("ApplicationComponent", "application", {
      name: "Application Service",
      description: "Handles mortgage application CRUD, validation, and state management",
      component_type: "microservice",
      language: "TypeScript",
      package_path: "packages/application-service",
      repo_path: "packages/application-service/src",
      interface_spec: "REST API + Kafka consumer/producer",
      code_hints: "Express.js, TypeORM, PostgreSQL. Entry: src/index.ts",
      dependencies_notes: "Depends on eligibility-service, credit-bureau-adapter, doc-service",
      acceptance_criteria: "All CRUD operations work, state machine transitions validated, events published",
      tags: ["application-service", "microservice"],
    });

    const eligibilityService = makeNode("ApplicationComponent", "application", {
      name: "Eligibility Service",
      description: "Evaluates loan eligibility based on configurable business rules",
      component_type: "microservice",
      language: "TypeScript",
      package_path: "packages/eligibility-service",
      repo_path: "packages/eligibility-service/src",
      interface_spec: "REST API",
      code_hints: "Drools-like rules engine, rules in YAML config",
      dependencies_notes: "Standalone, reads rules from config service",
      acceptance_criteria: "All rule combinations evaluated correctly, decision audit trail maintained",
      tags: ["eligibility", "rules-engine"],
    });

    const creditAdapter = makeNode("ApplicationComponent", "application", {
      name: "Credit Bureau Adapter",
      description: "Adapter for communicating with credit bureaus (Experian, Equifax, TransUnion)",
      component_type: "adapter",
      language: "TypeScript",
      package_path: "packages/credit-bureau-adapter",
      repo_path: "packages/credit-bureau-adapter/src",
      interface_spec: "Internal REST API, external SOAP/XML to bureaus",
      code_hints: "Circuit breaker pattern, 30s timeout, 2 retries",
      dependencies_notes: "External: credit bureau APIs",
      acceptance_criteria: "Tri-merge report retrieved within 30s, graceful degradation if bureau unavailable",
      tags: ["credit", "adapter", "integration"],
    });

    // APIs
    const createAppAPI = makeNode("API", "application", {
      name: "Create Mortgage Application",
      description: "Creates a new mortgage loan application",
      api_type: "rest",
      method: "POST",
      path: "/api/v1/applications",
      auth_type: "OAuth2 Bearer",
      rate_limit: "100 req/min per client",
      request_schema: '{"borrower": {"ssn": "string", "firstName": "string", "lastName": "string", ...}, "property": {"address": "string", "value": "number"}, "loanAmount": "number", "loanType": "conventional|fha|va"}',
      response_schema: '{"applicationId": "uuid", "status": "received", "preQualEligible": "boolean", "estimatedDecisionDate": "datetime"}',
      error_codes: "400: Invalid input, 409: Duplicate application, 422: Ineligible property, 503: Credit bureau unavailable",
      code_hints: "Handler: ApplicationController.create(), validates via Zod, publishes ApplicationCreated event",
      tags: ["create", "application", "rest"],
    });

    const getAppAPI = makeNode("API", "application", {
      name: "Get Application Status",
      description: "Retrieves the current status and details of a mortgage application",
      api_type: "rest",
      method: "GET",
      path: "/api/v1/applications/{applicationId}",
      auth_type: "OAuth2 Bearer",
      rate_limit: "500 req/min per client",
      request_schema: "Path param: applicationId (UUID)",
      response_schema: '{"applicationId": "uuid", "status": "string", "borrower": {...}, "property": {...}, "timeline": [...]}',
      error_codes: "404: Application not found, 403: Not authorized",
      code_hints: "Handler: ApplicationController.getById(), includes related entities",
      tags: ["get", "application", "rest"],
    });

    const eligibilityAPI = makeNode("API", "application", {
      name: "Check Eligibility",
      description: "Runs eligibility rules against application data",
      api_type: "rest",
      method: "POST",
      path: "/api/v1/eligibility/check",
      auth_type: "Internal service auth",
      rate_limit: "1000 req/min",
      request_schema: '{"creditScore": "number", "annualIncome": "number", "loanAmount": "number", "propertyValue": "number", "loanType": "string"}',
      response_schema: '{"eligible": "boolean", "decision": "eligible|ineligible|refer", "reasons": ["string"], "maxLoanAmount": "number"}',
      error_codes: "400: Missing required fields, 500: Rules engine error",
      code_hints: "Handler: EligibilityController.check(), calls RulesEngine.evaluate()",
      tags: ["eligibility", "check", "internal"],
    });

    // ── Physical Data Layer ──
    console.log("Creating physical data layer...");

    // DataStores
    const pgDataStore = makeNode("DataStore", "data", {
      name: "LoanOS PostgreSQL",
      description: "Primary relational database for the LoanOS loan origination system",
      store_type: "database",
      technology: "PostgreSQL 15 on AWS RDS",
      environment: "production",
      connection_info: "RDS endpoint, port 5432, SSL required",
      code_hints: "TypeORM migrations, connection via DATABASE_URL env var",
      tags: ["postgresql", "rds", "primary"],
    });

    const redisDataStore = makeNode("DataStore", "data", {
      name: "LoanOS Redis Cache",
      description: "In-memory cache for application lookups and eligibility rules config",
      store_type: "cache",
      technology: "Redis 7 on ElastiCache",
      environment: "production",
      connection_info: "ElastiCache endpoint, port 6379",
      code_hints: "Cache-aside for app lookups, write-through for rules config. TTL: 30s-5min",
      tags: ["redis", "cache", "elasticache"],
    });

    const kafkaDataStore = makeNode("DataStore", "data", {
      name: "LoanOS Kafka",
      description: "Event streaming platform for asynchronous service communication",
      store_type: "message_broker",
      technology: "Apache Kafka on AWS MSK",
      environment: "production",
      connection_info: "MSK broker endpoints, SASL/SSL",
      code_hints: "Topics partitioned by application_id. DLQ after 3 retries.",
      tags: ["kafka", "msk", "events"],
    });

    const s3DataStore = makeNode("DataStore", "data", {
      name: "LoanOS S3",
      description: "Object storage for generated documents, credit report raw data, and uploaded files",
      store_type: "file_store",
      technology: "AWS S3",
      environment: "production",
      connection_info: "S3 bucket: acmebank-loanos-documents",
      code_hints: "Versioned bucket, lifecycle: 1yr IA, 7yr Glacier",
      tags: ["s3", "documents", "storage"],
    });

    // DataObjects (PostgreSQL tables)
    const loanAppTable = makeNode("DataObject", "data", {
      name: "loan_applications",
      description: "PostgreSQL table storing mortgage loan applications with state machine status tracking",
      object_type: "table",
      physical_name: "loan_applications",
      schema_definition: "id UUID PK, borrower_id UUID FK, loan_amount DECIMAL, loan_type VARCHAR, status VARCHAR, dti_ratio DECIMAL, ltv_ratio DECIMAL, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ",
      format: "sql",
      code_hints: "Partitioned by created_at (monthly). ORM model: LoanApplication",
      tags: ["table", "loans", "core"],
    });

    const borrowersTable = makeNode("DataObject", "data", {
      name: "borrowers",
      description: "PostgreSQL table storing borrower personal and financial information with encrypted PII",
      object_type: "table",
      physical_name: "borrowers",
      schema_definition: "id UUID PK, ssn_encrypted BYTEA, ssn_hash VARCHAR(64) UNIQUE, first_name VARCHAR, last_name VARCHAR, email VARCHAR UNIQUE, annual_income DECIMAL, credit_score SMALLINT",
      format: "sql",
      code_hints: "SSN encrypted via AES-256, hash for lookups. ORM model: Borrower",
      tags: ["table", "borrowers", "pii"],
    });

    const creditReportsTable = makeNode("DataObject", "data", {
      name: "credit_reports",
      description: "PostgreSQL table storing credit bureau reports with scores and S3 references to raw data",
      object_type: "table",
      physical_name: "credit_reports",
      schema_definition: "id UUID PK, borrower_id UUID FK, bureau VARCHAR, score SMALLINT, report_date DATE, raw_data_ref VARCHAR (S3 key)",
      format: "sql",
      code_hints: "Raw XML stored in S3, only metadata in PG. Partitioned by report_date",
      tags: ["table", "credit", "reports"],
    });

    // DataObjects (other types)
    const loanAppType = makeNode("DataObject", "data", {
      name: "LoanApplication Type",
      description: "TypeScript interface representing a loan application in the application service codebase",
      object_type: "type",
      physical_name: "LoanApplication",
      schema_definition: "interface LoanApplication { id: string; borrowerId: string; loanAmount: number; loanType: LoanType; status: ApplicationStatus; dtiRatio?: number; ltvRatio?: number; }",
      format: "typescript",
      code_hints: "packages/application-service/src/types/loan-application.ts",
      tags: ["type", "typescript", "interface"],
    });

    const kafkaTopic = makeNode("DataObject", "data", {
      name: "loan.application.created",
      description: "Kafka topic for application created events, consumed by Eligibility, Notification, and Fraud services",
      object_type: "topic",
      physical_name: "loan.application.created",
      schema_definition: "key: applicationId (UUID), value: { applicationId, borrowerId, loanAmount, loanType, timestamp }",
      format: "json",
      code_hints: "Partition key: applicationId. Retention: 7 days. Consumers: eligibility-cg, notification-cg, fraud-cg",
      tags: ["topic", "kafka", "event"],
    });

    const createAppPayload = makeNode("DataObject", "data", {
      name: "CreateApplicationRequest",
      description: "API request payload schema for creating a new mortgage application",
      object_type: "payload",
      physical_name: "CreateApplicationRequest",
      schema_definition: "{ borrower: { ssn, firstName, lastName, dob, email, phone?, employer?, annualIncome }, property: { address, city, state, zip, estimatedValue, propertyType }, loanAmount, loanType }",
      format: "json_schema",
      code_hints: "Validated via Zod in ApplicationController.create(). See openapi spec for full schema.",
      tags: ["payload", "api", "request"],
    });

    // DataFields (sample for loan_applications table)
    const fieldId = makeNode("DataField", "data", {
      name: "id",
      description: "Primary key for loan applications",
      field_type: "UUID",
      physical_name: "id",
      nullable: false,
      default_value: "gen_random_uuid()",
      constraints: "PRIMARY KEY",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["pk", "uuid"],
    });

    const fieldBorrowerId = makeNode("DataField", "data", {
      name: "borrower_id",
      description: "Foreign key to borrowers table",
      field_type: "UUID",
      physical_name: "borrower_id",
      nullable: false,
      default_value: "",
      constraints: "FOREIGN KEY → borrowers.id, ON DELETE RESTRICT",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["fk", "borrower"],
    });

    const fieldLoanAmount = makeNode("DataField", "data", {
      name: "loan_amount",
      description: "Requested mortgage loan amount in USD",
      field_type: "DECIMAL(12,2)",
      physical_name: "loan_amount",
      nullable: false,
      default_value: "",
      constraints: "CHECK (loan_amount > 0)",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["amount", "financial"],
    });

    const fieldLoanType = makeNode("DataField", "data", {
      name: "loan_type",
      description: "Mortgage loan program type",
      field_type: "VARCHAR(20)",
      physical_name: "loan_type",
      nullable: false,
      default_value: "",
      constraints: "CHECK (loan_type IN ('conventional','fha','va','usda'))",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["enum", "loan-type"],
    });

    const fieldStatus = makeNode("DataField", "data", {
      name: "status",
      description: "Current application state machine status",
      field_type: "VARCHAR(30)",
      physical_name: "status",
      nullable: false,
      default_value: "'received'",
      constraints: "CHECK (status IN ('received','in_review','approved','denied','withdrawn','funded'))",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["status", "state-machine"],
    });

    const fieldDtiRatio = makeNode("DataField", "data", {
      name: "dti_ratio",
      description: "Calculated debt-to-income ratio as percentage",
      field_type: "DECIMAL(5,2)",
      physical_name: "dti_ratio",
      nullable: true,
      default_value: "",
      constraints: "CHECK (dti_ratio >= 0 AND dti_ratio <= 100)",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["ratio", "calculated"],
    });

    const fieldLtvRatio = makeNode("DataField", "data", {
      name: "ltv_ratio",
      description: "Calculated loan-to-value ratio as percentage",
      field_type: "DECIMAL(5,2)",
      physical_name: "ltv_ratio",
      nullable: true,
      default_value: "",
      constraints: "CHECK (ltv_ratio >= 0 AND ltv_ratio <= 200)",
      pii: false,
      sensitivity: "",
      code_hints: "",
      tags: ["ratio", "calculated"],
    });

    // ── Glossary Terms ──
    console.log("Creating glossary terms...");

    const dtiRatio = makeNode("GlossaryTerm", "business", {
      name: "Debt-to-Income Ratio",
      description: "The percentage of a borrower's gross monthly income that goes toward paying monthly debt obligations",
      canonical_name: "dtiRatio",
      domain: "Consumer Banking",
      owner: "Chief Credit Officer",
      steward: "Risk Analytics Team",
      synonyms: ["DTI", "debt income ratio", "debt_to_income"],
      definition: "DTI = (total monthly debt payments + proposed monthly housing payment) / gross monthly income × 100. Used as primary affordability metric in mortgage underwriting.",
      data_type: "decimal(5,2)",
      allowed_values: "0.00 - 100.00 (percentage)",
      gdpr_category: "none",
      privacy_class: "internal",
      dq_rules: "Must be recalculated when income or debt changes; must use verified income for final decision",
      regulatory_refs: ["QM Rule (43% max)", "Fannie Mae (50% max with compensating factors)", "TILA"],
      code_hints: "Variable: dtiRatio, type: number, compute in eligibility-service. Formula: (totalMonthlyDebt + proposedPayment) / grossMonthlyIncome * 100",
      tags: ["ratio", "underwriting", "affordability"],
    });

    const ltvRatio = makeNode("GlossaryTerm", "business", {
      name: "Loan-to-Value Ratio",
      description: "The ratio of a mortgage loan amount to the appraised value of the property",
      canonical_name: "ltvRatio",
      domain: "Consumer Banking",
      owner: "Chief Credit Officer",
      steward: "Risk Analytics Team",
      synonyms: ["LTV", "loan_to_value", "loan value ratio"],
      definition: "LTV = loan amount / min(appraised value, purchase price) × 100. Determines PMI requirement and loan program eligibility.",
      data_type: "decimal(5,2)",
      allowed_values: "0.00 - 200.00 (percentage, can exceed 100 for underwater loans)",
      gdpr_category: "none",
      privacy_class: "internal",
      dq_rules: "Must use lower of appraised value or purchase price for purchases; appraised value only for refinances",
      regulatory_refs: ["Conventional max 97%", "FHA max 96.5%", "VA max 100%"],
      code_hints: "Variable: ltvRatio, type: number, compute in eligibility-service. Formula: loanAmount / Math.min(appraisedValue, purchasePrice) * 100",
      tags: ["ratio", "underwriting", "collateral"],
    });

    const ssn = makeNode("GlossaryTerm", "business", {
      name: "Social Security Number",
      description: "Nine-digit unique identifier issued by the Social Security Administration to U.S. citizens and eligible residents",
      canonical_name: "ssn",
      domain: "Consumer Banking",
      owner: "Chief Privacy Officer",
      steward: "Data Governance Team",
      synonyms: ["SSN", "social security", "social_security_number", "tax ID"],
      definition: "A 9-digit number in format XXX-XX-XXXX used to identify individuals for credit reporting, tax purposes, and identity verification in financial services.",
      data_type: "string(11)",
      allowed_values: "Format: XXX-XX-XXXX where X is digit. Area number 001-899 (excl 666), group 01-99, serial 0001-9999",
      gdpr_category: "sensitive",
      privacy_class: "restricted",
      dq_rules: "Must pass Luhn-like checksum; must be unique per borrower; must be stored encrypted (AES-256); must be masked in logs as XXX-XX-####",
      regulatory_refs: ["GLBA", "FCRA", "ECOA", "IRS regulations"],
      code_hints: "Variable: ssn, type: string. ALWAYS encrypt at rest (ssn_encrypted BYTEA), store hash for lookups (ssn_hash VARCHAR(64)). Mask in all log output. Never include in API responses.",
      tags: ["pii", "identifier", "restricted"],
    });

    const loanType = makeNode("GlossaryTerm", "business", {
      name: "Loan Type",
      description: "The classification of a mortgage loan based on its backing agency or program",
      canonical_name: "loanType",
      domain: "Consumer Banking",
      owner: "VP Lending",
      steward: "Product Team",
      synonyms: ["loan program", "mortgage type", "loan_program_type"],
      definition: "Categorizes mortgage loans by their guarantor/insurer: Conventional (no government backing), FHA (Federal Housing Administration), VA (Veterans Affairs), USDA (US Department of Agriculture). Each type has different eligibility criteria, down payment requirements, and insurance rules.",
      data_type: "enum",
      allowed_values: "conventional, fha, va, usda",
      gdpr_category: "none",
      privacy_class: "internal",
      dq_rules: "Must be one of the allowed enum values; determines which eligibility rule set to apply",
      regulatory_refs: ["National Housing Act (FHA)", "Servicemen's Readjustment Act (VA)", "Housing Act of 1949 (USDA)"],
      code_hints: "Variable: loanType, type: 'conventional' | 'fha' | 'va' | 'usda'. Use as discriminator for eligibility rule lookup table.",
      tags: ["enum", "classification", "product"],
    });

    // ── Spec Layer ──
    console.log("Creating spec documents...");

    // Original specs (openapi, erd, test_spec)
    const openAPISpec = makeNode("SpecDocument", "spec", {
      name: "Mortgage Application OpenAPI",
      description: "OpenAPI 3.0 specification for the Mortgage Application API",
      spec_type: "openapi",
      format: "yaml",
      content: `openapi: "3.0.3"
info:
  title: Mortgage Application API
  version: "1.0.0"
  description: API for mortgage loan application management
paths:
  /api/v1/applications:
    post:
      summary: Create mortgage application
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateApplicationRequest'
      responses:
        "201":
          description: Application created
        "400":
          description: Invalid input
        "409":
          description: Duplicate application
  /api/v1/applications/{applicationId}:
    get:
      summary: Get application status
      parameters:
        - name: applicationId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: Application details
components:
  schemas:
    CreateApplicationRequest:
      type: object
      required: [borrower, property, loanAmount, loanType]
      properties:
        borrower:
          type: object
          properties:
            ssn: { type: string }
            firstName: { type: string }
            lastName: { type: string }
        property:
          type: object
          properties:
            address: { type: string }
            value: { type: number }
        loanAmount: { type: number }
        loanType: { type: string, enum: [conventional, fha, va, usda] }`,
      content_hash: "",
      tags: ["openapi", "mortgage", "api"],
    });

    const erdSpec = makeNode("SpecDocument", "spec", {
      name: "Loan Application ERD",
      description: "Entity-relationship diagram for loan application data model",
      spec_type: "data_model",
      format: "mermaid",
      content: `erDiagram
    BORROWER ||--o{ LOAN_APPLICATION : applies
    BORROWER {
        uuid borrower_id PK
        string ssn UK
        string first_name
        string last_name
        date dob
        string email
        string phone
        string employer
        decimal annual_income
    }
    LOAN_APPLICATION ||--o{ CREDIT_REPORT : has
    LOAN_APPLICATION {
        uuid application_id PK
        uuid borrower_id FK
        uuid property_id FK
        decimal loan_amount
        string loan_type
        string status
        timestamp created_at
        timestamp updated_at
    }
    LOAN_APPLICATION ||--|| PROPERTY : for
    PROPERTY {
        uuid property_id PK
        string address
        decimal appraised_value
        string property_type
    }
    CREDIT_REPORT {
        uuid report_id PK
        uuid borrower_id FK
        string bureau
        int score
        date report_date
    }`,
      content_hash: "",
      tags: ["erd", "data-model", "mortgage"],
    });

    const testSpec = makeNode("SpecDocument", "spec", {
      name: "Application Service Test Spec",
      description: "Test specification for the Application Service component",
      spec_type: "test_spec",
      format: "markdown",
      content: `# Application Service Test Spec

## Unit Tests

### ApplicationController.create()
- **T1**: Valid conventional loan application → 201 with applicationId
- **T2**: Missing required borrower fields → 400 with field errors
- **T3**: Loan amount <= 0 → 400 validation error
- **T4**: Invalid loan type → 400 with enum error
- **T5**: Duplicate SSN + property → 409 conflict

### EligibilityEngine.evaluate()
- **T6**: DTI = 42% → eligible
- **T7**: DTI = 44% → ineligible, reason: "DTI exceeds 43%"
- **T8**: Credit score = 619 → ineligible, reason: "Credit score below 620"
- **T9**: LTV = 98% → ineligible, reason: "LTV exceeds 97%"
- **T10**: All criteria borderline passing → eligible

## Integration Tests
- **T11**: Create application → verify Kafka event published
- **T12**: Create application → verify credit report pulled
- **T13**: Get application by ID → verify all related data included

## E2E Tests
- **T14**: Full flow: submit → credit pull → eligibility → pre-qual letter generated
- **T15**: Rejection flow: submit → credit pull → ineligible → rejection notice`,
      content_hash: "",
      tags: ["tests", "application-service"],
    });

    // ── New template-based specs ──

    const complianceSpec = makeNode("SpecDocument", "spec", {
      name: "Lending Compliance & Security",
      description: "Regulatory compliance and security controls for the retail lending platform",
      spec_type: "compliance_security",
      format: "markdown",
      content: `# Compliance & Security Specification

## 1. Context

**Scope:** Retail Lending platform — mortgage origination, servicing, and collections
**Owner:** Chief Compliance Officer / VP Lending
**Last Reviewed:** 2025-01-15

## 2. Regulatory Requirements

| Regulation | Requirement | Metric / Threshold | Evidence Required |
|------------|-------------|-------------------|-------------------|
| TILA (Reg Z) | Truth in Lending disclosures | APR disclosed within 0.125% accuracy | Disclosure audit log |
| RESPA (Reg X) | Settlement procedure disclosures | Loan Estimate within 3 business days | Delivery confirmation |
| ECOA (Reg B) | Equal Credit Opportunity | Zero prohibited-factor usage in decisions | Decision audit trail |
| HMDA (Reg C) | Home Mortgage Disclosure Act | 100% of applications reported annually | LAR submission receipt |
| FCRA | Fair Credit Reporting | Adverse action notice within 30 days | Notice delivery log |
| GLBA | Financial privacy | Customer consent before data sharing | Consent records |
| QM Rule | Qualified Mortgage standards | DTI ≤ 43%, no neg-am, no balloon | Underwriting checklist |

## 3. Security Controls

### 3.1 Authentication

- **Method:** OAuth2 with PKCE for customer-facing, mTLS for service-to-service
- **MFA Required:** Yes — all customer login, all internal admin access
- **Session Policy:** 15-minute idle timeout, 8-hour max session, rotate refresh tokens
- **Identity Provider:** Okta (internal), Auth0 (customer-facing)

### 3.2 Authorization

- **Model:** RBAC with attribute-based data scoping
- **Roles:**
  | Role | Permissions | Data Scope |
  |------|------------|------------|
  | loan_officer | Create, read, update applications | Assigned branch only |
  | underwriter | Read applications, approve/deny | Assigned queue only |
  | compliance_admin | Read all, run reports | All data, read-only |
  | system_admin | Full CRUD | All data |
  | customer | Read own, submit applications | Own data only |
- **Elevation Policy:** Break-glass via PagerDuty approval, 2-hour window, full audit

### 3.3 Encryption

- **At Rest:** AES-256-GCM via AWS KMS, envelope encryption for PII fields (SSN, DOB)
- **In Transit:** TLS 1.3 for all external, mTLS for internal service mesh
- **Key Rotation:** Annual for master keys, per-session for data keys
- **Secrets Management:** AWS Secrets Manager with IAM-role-based access

### 3.4 Audit Logging

- **Events Captured:** Login, application access, data modification, decision made, document generated, data export
- **Retention Period:** 7 years (regulatory), immutable after write
- **Log Format:** Structured JSON — \`{timestamp, actor, action, resource, outcome, ip, trace_id}\`
- **Tamper Protection:** CloudWatch Logs with log group integrity validation

## 4. Data Protection

- **Classification:** Restricted (SSN, credit reports), Confidential (income, employment), Internal (application status)
- **PII Fields:** ssn, dob, credit_score, annual_income, employer, bank_account_number
- **Masking Rules:** SSN masked as XXX-XX-1234 in all logs and non-prod environments
- **Data Residency:** US-only (AWS us-east-1, us-west-2)
- **Retention & Purge:** 7 years post-loan-closure, GDPR-style erasure for withdrawn applications after 25 months

## 5. Threat Model

| Threat | Attack Vector | Likelihood | Impact | Mitigation |
|--------|--------------|------------|--------|------------|
| PII data breach | SQL injection / API exploit | Medium | Critical | Parameterized queries, WAF, field-level encryption |
| Unauthorized decision access | Privilege escalation | Low | High | RBAC enforcement, audit logging |
| Credit bureau credential theft | Secrets exposure | Low | Critical | Secrets Manager, mTLS, no env vars |
| Synthetic identity fraud | Fake applications | High | High | Identity verification service, velocity checks |
| Insider data exfiltration | Bulk data export | Low | Critical | DLP controls, export logging, anomaly detection |

## 6. Validation & Testing

- [x] Annual penetration test (last: 2024-11)
- [x] OWASP Top 10 review completed
- [x] Access control matrix verified quarterly
- [x] Encryption at rest verified via AWS Config rule
- [ ] Data purge mechanism — scheduled for Q2 2025
- [x] Incident response plan documented and tested

---
*AI Agent Guidance: Use this spec to generate security middleware, audit logging interceptors, encryption configurations, and compliance validation tests. Pay special attention to the role matrix and threat mitigations when generating authorization code.*`,
      content_hash: "",
      tags: ["compliance", "security", "lending", "regulatory"],
    });

    const architectureSpec = makeNode("SpecDocument", "spec", {
      name: "LoanOS Architecture",
      description: "System architecture specification for the LoanOS loan origination platform",
      spec_type: "architecture",
      format: "markdown",
      content: `# Architecture Specification — LoanOS

## 1. Overview

**System:** LoanOS — Loan Origination System
**Purpose:** End-to-end mortgage application processing from submission through funding
**Architecture Style:** Microservices with event sourcing

## 2. System Layers

\`\`\`mermaid
graph TD
    subgraph Presentation
        WebUI[Borrower Portal - React]
        LO_UI[Loan Officer UI - React]
        API_GW[API Gateway - Kong]
    end
    subgraph Application
        AppSvc[Application Service]
        EligSvc[Eligibility Service]
        DocSvc[Document Service]
        NotifSvc[Notification Service]
    end
    subgraph Integration
        CreditAdapt[Credit Bureau Adapter]
        FraudAdapt[Fraud Detection Adapter]
    end
    subgraph Data
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
        Kafka[Kafka Event Bus]
        S3[S3 Document Store]
    end

    WebUI --> API_GW
    LO_UI --> API_GW
    API_GW --> AppSvc
    API_GW --> DocSvc
    AppSvc --> PG
    AppSvc --> Redis
    AppSvc --> Kafka
    AppSvc --> EligSvc
    AppSvc --> CreditAdapt
    EligSvc --> PG
    DocSvc --> S3
    DocSvc --> PG
    NotifSvc --> Kafka
    CreditAdapt --> PG
    FraudAdapt --> Kafka
\`\`\`

## 3. Services

| Service | Responsibility | Tech Stack | Communication | SLA |
|---------|---------------|------------|---------------|-----|
| Application Service | Application CRUD, state machine, orchestration | TypeScript / Express | REST + Kafka producer | 99.95% uptime, <500ms p99 |
| Eligibility Service | Rule evaluation, decision engine | TypeScript / Express | REST (sync) | 99.9% uptime, <200ms p99 |
| Document Service | PDF generation, document storage | TypeScript / Express | REST + S3 | 99.9% uptime, <2s for generation |
| Notification Service | Email, SMS, push notifications | TypeScript / Express | Kafka consumer | 99.5% uptime, eventual delivery |
| Credit Bureau Adapter | External credit bureau integration | TypeScript / Express | REST (outbound SOAP) | Depends on bureau SLA |
| API Gateway | Routing, auth, rate limiting | Kong | REST | 99.99% uptime |

## 4. Data Layer

### 4.1 Primary Storage
- **Technology:** PostgreSQL 15 on RDS
- **Schema Strategy:** TypeORM migrations, reviewed in PR
- **Partitioning:** loan_applications by created_at (monthly), credit_reports by report_date

### 4.2 Caching
- **Technology:** Redis 7 on ElastiCache
- **Strategy:** Cache-aside for application lookups, write-through for eligibility rules config
- **TTL Policy:** Application status: 30s, eligibility rules: 5min, borrower profile: 60s

### 4.3 Messaging
- **Technology:** Apache Kafka on MSK
- **Topics:**
  - \`loan.application.created\` → Eligibility, Notification, Fraud
  - \`loan.application.decided\` → Notification, Document
  - \`loan.credit.completed\` → Application Service
  - \`loan.document.generated\` → Notification
- **Ordering Guarantees:** Per application_id (partition key)
- **Dead Letter Policy:** 3 retries with exponential backoff, then DLQ, alert after 10 DLQ messages

## 5. Scalability

- **Horizontal Scaling:** All services stateless, HPA on CPU >70% or RPS >500/pod
- **Load Balancing:** Round-robin at Kong, consistent hashing for Kafka consumers
- **Rate Limiting:** 100 req/min per API key (customer), 1000 req/min (internal service)
- **Expected Load:** Peak 200 applications/hour, 1000 concurrent users, ~50GB data/month

## 6. Resilience

- **Circuit Breakers:** Credit Bureau Adapter (5 failures / 60s → 30s open), Eligibility calls from App Service
- **Retries:** 3x with exponential backoff (1s, 2s, 4s) + jitter for all external calls
- **Timeouts:** Gateway→Service: 10s, Service→Service: 5s, Service→Bureau: 30s
- **Fallbacks:** Credit bureau down → queue for async processing; Eligibility down → manual review queue
- **Health Checks:** /healthz (liveness, 10s), /readyz (readiness with DB+Redis+Kafka check, 5s)

## 7. Cross-Cutting Concerns

- **Authentication:** JWT validation at Kong gateway, mTLS for internal mesh
- **Observability:** OpenTelemetry → Datadog (traces), Prometheus (metrics), CloudWatch (logs)
- **Configuration:** AWS AppConfig for feature flags, Secrets Manager for credentials
- **Service Discovery:** Kubernetes DNS

---
*AI Agent Guidance: Use the Mermaid diagram and service table to understand system boundaries. When generating code for a specific service, reference the tech stack, communication patterns, and resilience policies. Implement circuit breakers and retries as specified.*`,
      content_hash: "",
      tags: ["architecture", "loanos", "microservices"],
    });

    const dataModelSpec = makeNode("SpecDocument", "spec", {
      name: "Loan Application Data Model",
      description: "Database schema specification for the loan application domain",
      spec_type: "data_model",
      format: "markdown",
      content: `# Data Model Specification — Loan Application Domain

## 1. Overview

**Domain:** Mortgage Loan Origination
**Storage:** PostgreSQL 15
**Naming Convention:** snake_case

## 2. Entities

### borrowers

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| ssn_encrypted | BYTEA | — | — | No | — | UNIQUE (via hash index) |
| ssn_hash | VARCHAR(64) | — | — | No | — | UNIQUE |
| first_name | VARCHAR(100) | — | — | No | — | — |
| last_name | VARCHAR(100) | — | — | No | — | — |
| dob_encrypted | BYTEA | — | — | No | — | — |
| email | VARCHAR(255) | — | — | No | — | UNIQUE, CHECK format |
| phone | VARCHAR(20) | — | — | Yes | NULL | E.164 format |
| employer | VARCHAR(255) | — | — | Yes | NULL | — |
| annual_income | DECIMAL(12,2) | — | — | No | 0.00 | CHECK >= 0 |
| credit_score | SMALLINT | — | — | Yes | NULL | CHECK 300-850 |
| created_at | TIMESTAMPTZ | — | — | No | NOW() | — |
| updated_at | TIMESTAMPTZ | — | — | No | NOW() | — |

### loan_applications

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| borrower_id | UUID | — | FK→borrowers.id | No | — | ON DELETE RESTRICT |
| property_id | UUID | — | FK→properties.id | No | — | ON DELETE RESTRICT |
| loan_amount | DECIMAL(12,2) | — | — | No | — | CHECK > 0 |
| loan_type | VARCHAR(20) | — | — | No | — | CHECK IN ('conventional','fha','va','usda') |
| status | VARCHAR(30) | — | — | No | 'received' | CHECK IN ('received','in_review','approved','denied','withdrawn','funded') |
| dti_ratio | DECIMAL(5,2) | — | — | Yes | NULL | CHECK 0-100 |
| ltv_ratio | DECIMAL(5,2) | — | — | Yes | NULL | CHECK 0-200 |
| decision_date | TIMESTAMPTZ | — | — | Yes | NULL | — |
| decision_reason | TEXT | — | — | Yes | NULL | — |
| version | INTEGER | — | — | No | 1 | Optimistic locking |
| created_at | TIMESTAMPTZ | — | — | No | NOW() | — |
| updated_at | TIMESTAMPTZ | — | — | No | NOW() | — |

### properties

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| address_line1 | VARCHAR(255) | — | — | No | — | — |
| city | VARCHAR(100) | — | — | No | — | — |
| state | CHAR(2) | — | — | No | — | — |
| zip | VARCHAR(10) | — | — | No | — | — |
| appraised_value | DECIMAL(12,2) | — | — | Yes | NULL | CHECK >= 0 |
| property_type | VARCHAR(20) | — | — | No | — | CHECK IN ('single_family','condo','townhouse','multi_family') |

### credit_reports

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| borrower_id | UUID | — | FK→borrowers.id | No | — | ON DELETE CASCADE |
| bureau | VARCHAR(20) | — | — | No | — | CHECK IN ('experian','equifax','transunion') |
| score | SMALLINT | — | — | No | — | CHECK 300-850 |
| report_date | DATE | — | — | No | — | — |
| raw_data_ref | VARCHAR(512) | — | — | No | — | S3 key |
| created_at | TIMESTAMPTZ | — | — | No | NOW() | — |

## 3. Relationships

\`\`\`mermaid
erDiagram
    BORROWERS ||--o{ LOAN_APPLICATIONS : "has many"
    LOAN_APPLICATIONS }o--|| PROPERTIES : "for property"
    BORROWERS ||--o{ CREDIT_REPORTS : "has reports"
    LOAN_APPLICATIONS ||--o{ APPLICATION_EVENTS : "has events"
\`\`\`

## 4. Indexes

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| borrowers | idx_borrowers_ssn_hash | ssn_hash | UNIQUE | SSN lookups |
| borrowers | idx_borrowers_email | email | UNIQUE | Email lookups |
| loan_applications | idx_apps_borrower | borrower_id | B-TREE | FK lookups |
| loan_applications | idx_apps_status_created | status, created_at | B-TREE | Queue/status filtering |
| loan_applications | idx_apps_property | property_id | B-TREE | FK lookups |
| credit_reports | idx_credits_borrower_date | borrower_id, report_date DESC | B-TREE | Latest report lookup |

## 5. Schema Evolution Strategy

- **Migration Tool:** TypeORM migrations
- **Versioning:** Timestamp-based (e.g., 1700000000000-AddDtiColumn.ts)
- **Backwards Compatibility:** Additive changes preferred; column renames done via add+backfill+drop
- **Rollback Strategy:** Down migrations for each up migration, tested in CI

---
*AI Agent Guidance: Use the entity tables to generate database migrations, ORM models, and TypeScript types. Pay attention to constraints and business rules for validation logic. Use the ER diagram to understand join patterns for queries.*`,
      content_hash: "",
      tags: ["data-model", "schema", "postgresql"],
    });

    const stateSpec = makeNode("SpecDocument", "spec", {
      name: "Loan Application State Machine",
      description: "State management specification for mortgage application lifecycle",
      spec_type: "state_management",
      format: "markdown",
      content: `# State Management Specification — Loan Application

## 1. Overview

**Entity:** Loan Application
**Purpose:** Track mortgage application through its lifecycle from submission to funding or rejection

## 2. State Entities

| Entity | States | Initial State | Terminal States |
|--------|--------|--------------|-----------------|
| Loan Application | received, in_review, approved, conditionally_approved, denied, withdrawn, funded | received | funded, denied, withdrawn |

## 3. State Flow

\`\`\`mermaid
stateDiagram-v2
    [*] --> received
    received --> in_review : begin_review()
    received --> withdrawn : withdraw()
    in_review --> approved : approve()
    in_review --> conditionally_approved : conditional_approve()
    in_review --> denied : deny()
    in_review --> withdrawn : withdraw()
    conditionally_approved --> approved : clear_conditions()
    conditionally_approved --> denied : deny()
    conditionally_approved --> withdrawn : withdraw()
    approved --> funded : fund()
    approved --> withdrawn : withdraw()
    funded --> [*]
    denied --> [*]
    withdrawn --> [*]
\`\`\`

**Transition Rules:**

| From | To | Trigger | Guard Conditions | Side Effects |
|------|-----|---------|-----------------|--------------|
| received | in_review | begin_review() | Credit report pulled, all required docs uploaded | Assign to underwriter queue, start SLA clock |
| received | withdrawn | withdraw() | Application age < 90 days | Release credit inquiry, notify borrower |
| in_review | approved | approve() | DTI ≤ 43%, LTV ≤ 97%, credit ≥ 620, underwriter signed off | Generate approval letter, notify borrower, publish event |
| in_review | conditionally_approved | conditional_approve() | Meets most criteria, specific conditions listed | Generate conditional letter with conditions list |
| in_review | denied | deny() | Underwriter decision with reason codes | Generate adverse action notice (ECOA), notify within 30 days |
| conditionally_approved | approved | clear_conditions() | All conditions satisfied and documented | Update approval letter, notify borrower |
| approved | funded | fund() | Closing docs signed, funds wired | Record funding date, publish funded event |

## 4. Concurrency & Synchronization

- **Locking Strategy:** Optimistic locking via \`version\` column — UPDATE ... WHERE version = $expected
- **Conflict Resolution:** Reject with 409 Conflict, client must refresh and retry
- **Idempotency:** Each transition request includes idempotency key; duplicate requests return previous result
- **Event Ordering:** Kafka partition by application_id ensures per-application ordering

## 5. Persistence

- **Storage:** \`status\` column on loan_applications table + \`application_events\` table for full history
- **History:** Event-sourced — every transition logged with actor, timestamp, from_state, to_state, reason
- **Snapshot Frequency:** Current state always on loan_applications.status (materialized)

## 6. Error Handling

- **Invalid Transitions:** Return 422 with \`{"error": "INVALID_TRANSITION", "from": "received", "to": "funded"}\`
- **Partial Failures:** If notification fails after state change, queue for retry (state change is committed)
- **Timeout Handling:** Applications in \`received\` > 90 days → auto-transition to \`withdrawn\` via daily job

---
*AI Agent Guidance: Use the state diagram and transition tables to generate state machine implementations. Implement guard conditions as validation functions. Wire up side effects as event handlers. Use optimistic locking with version field in all update queries.*`,
      content_hash: "",
      tags: ["state-machine", "lifecycle", "application"],
    });

    const workflowSpec = makeNode("SpecDocument", "spec", {
      name: "Mortgage Application Workflow",
      description: "Detailed workflow specification for the mortgage application process",
      spec_type: "workflow",
      format: "markdown",
      content: `# Workflow Specification — Mortgage Application

## 1. Context

**Process:** Mortgage Application Intake & Pre-Qualification
**Trigger:** Customer submits mortgage application via web portal, mobile app, or branch
**Outcome:** Application pre-qualified and queued for underwriting, or rejected with adverse action notice
**SLA:** Digital channel: pre-qualification within 4 hours; Branch: same business day

## 2. Actors

| Actor | Type | Role in Workflow |
|-------|------|-----------------|
| Borrower | External user | Submits application and documents |
| System (Application Service) | Automated | Validates, orchestrates, records |
| Credit Bureau | Third-party | Provides credit reports |
| Eligibility Engine | Automated | Evaluates rules |
| Document Service | Automated | Generates letters/PDFs |
| Loan Officer | Internal user | Reviews exceptions, assists borrowers |

## 3. Workflow Steps

### Step 1: Receive Application
- **Actor:** Borrower → System
- **Input:** Borrower info (name, SSN, DOB, income, employer), property info (address, estimated value), loan amount, loan type
- **Action:** Validate all required fields, check for duplicate applications (SSN + property within 30 days)
- **Business Rules:**
  - SSN must be valid format and pass checksum
  - Borrower age ≥ 18
  - Loan amount > $10,000 and < $3,000,000
  - Property must be in a supported state
- **Output:** Application record created with status=received
- **Next:** Step 2

### Step 2: Pull Credit Report
- **Actor:** System → Credit Bureau
- **Input:** Borrower SSN, name, DOB
- **Action:** Request tri-merge credit report from all 3 bureaus via Credit Bureau Adapter
- **External Call:** POST /internal/credit-bureau/pull — timeout: 30s, retry: 2x with 5s backoff
- **Business Rules:**
  - Use highest of 3 middle scores as representative score
  - If only 2 bureaus respond, use lower middle score
  - If < 2 bureaus respond, flag for manual review
- **Output:** Credit report stored, representative score calculated
- **Next:** Step 3

### Step 3: Decision Gateway — Auto-Eligible?
- **Type:** Exclusive Gateway
- **Condition:**
  - All 3 bureaus responded AND credit score ≥ 660 AND income verified → Step 4 (Auto-Evaluate)
  - Otherwise → Step 5 (Manual Review Queue)

### Step 4: Auto-Evaluate Eligibility
- **Actor:** System → Eligibility Engine
- **Input:** Credit score, income, loan amount, property value, loan type
- **Action:** Run eligibility rules engine
- **Business Rules:**
  - DTI ≤ 43% (monthly debt payments / gross monthly income)
  - LTV ≤ 97% for conventional, ≤ 96.5% for FHA
  - Credit score ≥ 620 for conventional, ≥ 580 for FHA
  - No bankruptcies within 4 years (conventional) / 2 years (FHA)
- **Output:** Decision: eligible / ineligible / refer-to-underwriter, with reasons
- **Next:** Step 6 (if eligible) / Step 7 (if ineligible) / Step 5 (if refer)

### Step 5: Manual Review
- **Actor:** Loan Officer
- **Input:** Application with credit report and auto-evaluation notes
- **Action:** Review and make decision
- **Timeout:** 24 hours — escalate to supervisor if not actioned
- **Output:** Decision with notes
- **Next:** Step 6 (if approved) / Step 7 (if denied)

### Step 6: Generate Pre-Qualification Letter
- **Actor:** System → Document Service
- **Input:** Approved application, loan terms
- **Action:** Generate pre-qualification letter PDF, store in S3, email to borrower
- **Output:** Letter generated, application status → in_review (queued for underwriting)
- **Next:** End (awaits underwriting process)

### Step 7: Generate Rejection Notice
- **Actor:** System → Document Service
- **Input:** Denied application, denial reasons
- **Action:** Generate adverse action notice (ECOA-compliant), store in S3, mail to borrower
- **Business Rules:**
  - Must include specific reason codes from FCRA
  - Must include credit bureau contact information
  - Must be delivered within 30 days of decision
- **Output:** Adverse action notice sent, application status → denied
- **Next:** End

## 4. Error Handling

| Error Scenario | At Step | Handling | Retry? | Compensation |
|---------------|---------|----------|--------|--------------|
| Credit bureau timeout | Step 2 | Retry with backoff | 2 retries, 5s/10s | None — not committed |
| All bureaus unavailable | Step 2 | Route to manual queue | No | None |
| Eligibility engine error | Step 4 | Route to manual queue | 1 retry | None |
| Document generation failure | Step 6/7 | Queue for retry | 3 retries over 1h | None — decision committed |
| Email delivery failure | Step 6/7 | Queue for retry | 5 retries over 24h | None — letter stored in S3 |

## 5. State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Received : Application submitted
    Received --> CreditPull : Begin processing
    CreditPull --> AutoEvaluating : All bureaus responded
    CreditPull --> ManualReview : Bureau issues
    AutoEvaluating --> PreQualified : Eligible
    AutoEvaluating --> ManualReview : Refer
    AutoEvaluating --> Denied : Ineligible
    ManualReview --> PreQualified : Approved
    ManualReview --> Denied : Rejected
    PreQualified --> [*]
    Denied --> [*]
\`\`\`

---
*AI Agent Guidance: Implement each step as a separate function or handler. Use the decision gateways to generate branching logic. Implement error handling and retries exactly as specified. Use the state diagram to track workflow progress.*`,
      content_hash: "",
      tags: ["workflow", "mortgage", "process"],
    });

    const apiInternalSpec = makeNode("SpecDocument", "spec", {
      name: "Application Service API Spec",
      description: "Internal API contract for the Application Service microservice",
      spec_type: "api_internal",
      format: "markdown",
      content: `# Internal API Specification — Application Service

## 1. Overview

**Service:** Application Service
**Base Path:** /api/v1/applications
**Protocol:** REST
**Authentication:** JWT (external via gateway) / mTLS (internal service-to-service)

## 2. Endpoints

### \`POST /api/v1/applications\`

**Description:** Create a new mortgage application
**Auth Required:** Yes — role: customer, loan_officer

**Request:**
\`\`\`json
{
  "borrower": {
    "ssn": "string (required, format: XXX-XX-XXXX)",
    "firstName": "string (required, 1-100 chars)",
    "lastName": "string (required, 1-100 chars)",
    "dob": "string (required, ISO8601 date)",
    "email": "string (required, email format)",
    "phone": "string (optional, E.164)",
    "employer": "string (optional)",
    "annualIncome": "number (required, > 0)"
  },
  "property": {
    "address": "string (required)",
    "city": "string (required)",
    "state": "string (required, 2-letter)",
    "zip": "string (required)",
    "estimatedValue": "number (required, > 0)",
    "propertyType": "string (required, enum: single_family|condo|townhouse|multi_family)"
  },
  "loanAmount": "number (required, 10000-3000000)",
  "loanType": "string (required, enum: conventional|fha|va|usda)"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "uuid",
  "status": "received",
  "borrowerId": "uuid",
  "loanAmount": 350000,
  "loanType": "conventional",
  "createdAt": "ISO8601",
  "estimatedDecisionDate": "ISO8601"
}
\`\`\`

**Guarantees:**
- Idempotent: Yes — duplicate SSN+property within 30 days returns existing application
- Consistency: Strong — synchronous DB write

---

### \`GET /api/v1/applications/:id\`

**Description:** Retrieve application details with related data
**Auth Required:** Yes — customer (own only), loan_officer (assigned), admin (all)

**Response (200):**
\`\`\`json
{
  "id": "uuid",
  "status": "in_review",
  "borrower": { "firstName": "...", "lastName": "...", "creditScore": 720 },
  "property": { "address": "...", "appraisedValue": 400000 },
  "loanAmount": 350000,
  "loanType": "conventional",
  "dtiRatio": 35.2,
  "ltvRatio": 87.5,
  "timeline": [
    { "event": "received", "timestamp": "...", "actor": "borrower" },
    { "event": "credit_pulled", "timestamp": "...", "actor": "system" }
  ],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
\`\`\`

---

### \`GET /api/v1/applications\`

**Description:** List applications with filtering and pagination
**Auth Required:** Yes — loan_officer (assigned branch), admin (all)

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| status | string | — | Filter by status |
| borrowerName | string | — | Search by borrower name |
| sort | string | createdAt | Sort field |
| order | string | desc | asc or desc |

---

### \`POST /api/v1/applications/:id/transition\`

**Description:** Trigger a state transition on an application
**Auth Required:** Yes — underwriter, admin

**Request:**
\`\`\`json
{
  "action": "approve",
  "reason": "All criteria met",
  "conditions": [],
  "version": 3
}
\`\`\`

**Response (200):** Updated application object with new status

## 3. Rate Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Per client (external) | 100 req | 1 minute |
| Per service (internal) | 1000 req | 1 minute |

## 4. Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request body |
| 401 | UNAUTHORIZED | Missing or invalid auth |
| 403 | FORBIDDEN | Insufficient permissions or wrong scope |
| 404 | NOT_FOUND | Application not found |
| 409 | DUPLICATE_APPLICATION | SSN+property already has active application |
| 409 | VERSION_CONFLICT | Optimistic lock failure |
| 422 | INVALID_TRANSITION | State transition not allowed |
| 429 | RATE_LIMITED | Too many requests |

---
*AI Agent Guidance: Use the endpoint definitions to generate route handlers, request validation schemas (Zod), and TypeScript types. Implement the state transition endpoint with guard conditions from the state management spec.*`,
      content_hash: "",
      tags: ["api", "internal", "application-service"],
    });

    const apiExternalSpec = makeNode("SpecDocument", "spec", {
      name: "Credit Bureau Integration Spec",
      description: "External API integration specification for credit bureau services",
      spec_type: "api_external",
      format: "markdown",
      content: `# External API Integration Specification — Credit Bureau

## 1. Overview

**Integration:** Tri-Merge Credit Bureau Service
**Providers:** Experian, Equifax, TransUnion (via aggregator)
**Purpose:** Pull consumer credit reports for mortgage underwriting
**Documentation:** [Bureau Aggregator API Portal — internal wiki]

## 2. Integrations

### Integration: Credit Report Pull

| Endpoint | Method | Purpose | Request Format | Response Format |
|----------|--------|---------|---------------|-----------------|
| /v2/credit/pull | POST | Request tri-merge credit report | JSON | JSON |
| /v2/credit/status/:requestId | GET | Check async pull status | — | JSON |
| /v2/credit/report/:reportId | GET | Retrieve completed report | — | JSON |

**Authentication:**
- **Method:** mTLS + API Key
- **Credentials Location:** Header: X-API-Key, mTLS client certificate
- **Key Rotation:** Quarterly, coordinated with vendor

**Base URLs:**
- Production: \`https://api.creditaggregator.example.com/v2\`
- Sandbox: \`https://sandbox.creditaggregator.example.com/v2\`

### Request Example
\`\`\`json
{
  "requestId": "our-internal-uuid",
  "consumer": {
    "ssn": "123-45-6789",
    "firstName": "John",
    "lastName": "Doe",
    "dob": "1985-03-15",
    "address": {
      "street": "123 Main St",
      "city": "Springfield",
      "state": "IL",
      "zip": "62701"
    }
  },
  "productType": "mortgage",
  "bureaus": ["experian", "equifax", "transunion"]
}
\`\`\`

### Response Example
\`\`\`json
{
  "reportId": "vendor-report-id",
  "status": "completed",
  "scores": {
    "experian": 720,
    "equifax": 715,
    "transunion": 725
  },
  "representativeScore": 720,
  "reportDate": "2025-01-15",
  "tradelineCount": 12,
  "derogatoryCount": 0,
  "inquiryCount": 3
}
\`\`\`

## 3. Timeout & Fallback Strategy

| Operation | Timeout | Retry Policy | Fallback |
|-----------|---------|-------------|----------|
| /v2/credit/pull | 30s | 2 retries, exponential backoff: 5s, 10s | Queue for async poll via /status |
| /v2/credit/status | 5s | 3 retries, 1s fixed | Return "pending" status |
| /v2/credit/report | 10s | 2 retries, 2s fixed | Return cached if available |

## 4. Circuit Breaker

| Parameter | Value |
|-----------|-------|
| Failure threshold | 5 failures in 60 seconds |
| Open duration | 30 seconds |
| Half-open probes | 1 request |
| Success threshold to close | 3 consecutive successes |
| Monitored errors | 5xx, timeouts, connection refused |

**When circuit is open:**
- Route application to manual review queue
- Log circuit state change event to Kafka
- Alert on-call via PagerDuty

## 5. Service Level Objectives

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| Availability | 99.5% | 5-minute rolling window | < 98% |
| Latency (p50) | 5s | Per-request | > 10s |
| Latency (p99) | 25s | Per-request | > 30s |
| Error rate | < 1% | 5-minute rolling | > 3% |

## 6. Data Mapping

| Our Field | Provider Field | Transform |
|-----------|---------------|-----------|
| borrower.ssn | consumer.ssn | Direct (already formatted) |
| borrower.firstName | consumer.firstName | Direct |
| credit_score | scores[bureau] | Extract per-bureau, calculate representative |
| report_s3_key | — | Store raw response JSON in S3 |

---
*AI Agent Guidance: Implement HTTP client with mTLS, the specified timeouts, retry policies, and circuit breaker. Use data mapping table for request/response transformation. Handle all fallback scenarios.*`,
      content_hash: "",
      tags: ["api", "external", "credit-bureau", "integration"],
    });

    const uiSpec = makeNode("SpecDocument", "spec", {
      name: "Borrower Application Form UI",
      description: "UI specification for the mortgage application intake form",
      spec_type: "ui_spec",
      format: "markdown",
      content: `# UI Specification — Mortgage Application Form

## 1. Overview

**Screen:** Mortgage Application Intake Form
**Purpose:** Allow borrowers to submit a mortgage application with all required information
**Entry Points:** "Apply Now" button on homepage, direct link from marketing

## 2. Layout

### Desktop (≥1024px)

\`\`\`
┌─────────────────────────────────────────────────┐
│  Header: "Apply for a Mortgage"  [Step X of 4]   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Step 1: Personal Information               │ │
│  │  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │ First Name   │  │ Last Name    │        │ │
│  │  └──────────────┘  └──────────────┘        │ │
│  │  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │ Email        │  │ Phone        │        │ │
│  │  └──────────────┘  └──────────────┘        │ │
│  │  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │ SSN          │  │ Date of Birth│        │ │
│  │  └──────────────┘  └──────────────┘        │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Step 2: Employment & Income                │ │
│  │  Employer, Position, Annual Income,          │ │
│  │  Years Employed                              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [Back]                              [Continue →] │
├─────────────────────────────────────────────────┤
│  Progress bar: ████░░░░  Step 1 of 4             │
└─────────────────────────────────────────────────┘
\`\`\`

### Mobile (<768px)

Single-column layout, same fields stacked vertically. Fixed bottom bar with Back/Continue buttons.

## 3. Steps

### Step 1: Personal Information
| Field | Input Type | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| First Name | Text | Yes | 1-100 chars, letters only | "John" |
| Last Name | Text | Yes | 1-100 chars, letters only | "Doe" |
| Email | Email | Yes | RFC 5322 format | "john@example.com" |
| Phone | Tel | No | E.164, 10-15 digits | "(555) 123-4567" |
| SSN | Masked input | Yes | XXX-XX-XXXX format | "___-__-____" |
| Date of Birth | Date picker | Yes | Age 18-120 | "MM/DD/YYYY" |

### Step 2: Employment & Income
| Field | Input Type | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Employer Name | Text | Yes | 1-255 chars | "Acme Corp" |
| Position | Text | No | 1-100 chars | "Software Engineer" |
| Annual Income | Currency | Yes | $1,000 - $99,999,999 | "$0.00" |
| Years at Employer | Number | Yes | 0-99 | "0" |

### Step 3: Property & Loan
| Field | Input Type | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Property Address | Address autocomplete | Yes | US address | "123 Main St" |
| Property Type | Select | Yes | single_family, condo, townhouse, multi_family | "Select type" |
| Estimated Value | Currency | Yes | $10,000 - $99,999,999 | "$0.00" |
| Loan Amount | Currency | Yes | $10,000 - $3,000,000 | "$0.00" |
| Loan Type | Select | Yes | Conventional, FHA, VA, USDA | "Select type" |

### Step 4: Review & Submit
Read-only summary of all entered data with Edit links per section. Consent checkboxes. Submit button.

## 4. Interactions

| Action | Trigger | Behavior | Success State | Error State |
|--------|---------|----------|--------------|-------------|
| Next step | Click "Continue" | Validate current step fields | Animate to next step | Shake invalid fields, show errors |
| Previous step | Click "Back" | No validation | Animate to previous step | — |
| Submit | Click "Submit Application" | POST /api/v1/applications | Redirect to confirmation page | Show error banner, preserve data |
| SSN input | Typing | Auto-format as XXX-XX-XXXX, mask middle digits | Formatted display | Red border if invalid |
| Save progress | Auto (30s) / blur | Save to localStorage | Silent | Silent |

## 5. States

| State | Visual | Data |
|-------|--------|------|
| Initial | Empty form, step 1 active | Check localStorage for saved progress |
| In progress | Partially filled form | Fields populated |
| Validating | Button shows spinner | POST in flight |
| Success | Redirect to /applications/:id/confirmation | Clear localStorage |
| Error (validation) | Red borders on invalid fields, error messages below | Preserve all input |
| Error (server) | Toast error at top | Preserve all input, retry enabled |

---
*AI Agent Guidance: Implement as a multi-step form with client-side validation per step. Use the field tables to generate form schemas (Zod) and React components. Implement auto-save to localStorage. Use SSN masking as specified.*`,
      content_hash: "",
      tags: ["ui", "form", "borrower", "application"],
    });

    const businessRulesSpec = makeNode("SpecDocument", "spec", {
      name: "Mortgage Eligibility Rules",
      description: "Business rules for mortgage eligibility decisions, pricing tiers, and threshold checks",
      spec_type: "business_rules",
      format: "markdown",
      content: `# Business Rules Specification — Mortgage Eligibility

## 1. Overview

**Domain:** Mortgage Loan Eligibility & Pricing
**Owner:** VP Lending / Chief Credit Officer
**Effective Date:** 2025-01-01
**Review Cycle:** Quarterly (aligned with investor guideline updates)

## 2. Decision Tables

### Decision: Loan Program Eligibility

| # | Loan Type | Credit Score | LTV | DTI | → Eligible | → Conditions |
|---|-----------|-------------|------|-----|-----------|-------------|
| 1 | Conventional | ≥ 740 | ≤ 80% | ≤ 36% | Yes | None |
| 2 | Conventional | ≥ 740 | 80-97% | ≤ 36% | Yes | PMI required |
| 3 | Conventional | 680-739 | ≤ 80% | ≤ 43% | Yes | None |
| 4 | Conventional | 680-739 | 80-97% | ≤ 43% | Yes | PMI required |
| 5 | Conventional | 620-679 | ≤ 90% | ≤ 43% | Yes | PMI required, additional reserves |
| 6 | Conventional | < 620 | Any | Any | No | — |
| 7 | FHA | ≥ 580 | ≤ 96.5% | ≤ 43% | Yes | MIP required |
| 8 | FHA | 500-579 | ≤ 90% | ≤ 43% | Yes | MIP required, manual underwriting |
| 9 | FHA | < 500 | Any | Any | No | — |
| 10 | VA | ≥ 620 | ≤ 100% | ≤ 41% | Yes | VA funding fee |
| 11 | VA | < 620 | Any | Any | Refer | Manual underwriting required |

**Priority:** Rules evaluated top-to-bottom; first match wins.

### Decision: Interest Rate Pricing

| # | Credit Score | LTV | Loan Type | → Rate Adjustment (bps) |
|---|-------------|------|-----------|------------------------|
| 1 | ≥ 760 | ≤ 60% | Conventional | -25 |
| 2 | ≥ 760 | 60-80% | Conventional | 0 (par) |
| 3 | 740-759 | ≤ 80% | Conventional | +12.5 |
| 4 | 720-739 | ≤ 80% | Conventional | +25 |
| 5 | 700-719 | ≤ 80% | Conventional | +50 |
| 6 | 680-699 | ≤ 80% | Conventional | +100 |
| 7 | 660-679 | ≤ 80% | Conventional | +175 |
| 8 | 640-659 | ≤ 80% | Conventional | +250 |
| 9 | 620-639 | ≤ 80% | Conventional | +325 |
| 10 | Any | 80-90% | Conventional | +25 (additive) |
| 11 | Any | 90-97% | Conventional | +50 (additive) |

## 3. Formulas

### Formula: Debt-to-Income Ratio (DTI)

\`\`\`
dti_ratio = (total_monthly_debt + proposed_monthly_payment) / gross_monthly_income × 100

where:
  total_monthly_debt = sum of all minimum monthly payments (credit cards, auto loans, student loans, etc.)
  proposed_monthly_payment = estimated PITI (principal + interest + taxes + insurance)
  gross_monthly_income = annual_income / 12

constraints:
  - maximum dti_ratio = 43% for QM (50% with compensating factors)
  - proposed_monthly_payment calculated at note rate (not teaser)
\`\`\`

### Formula: Loan-to-Value Ratio (LTV)

\`\`\`
ltv_ratio = loan_amount / property_value × 100

where:
  property_value = min(appraised_value, purchase_price)  // for purchases
  property_value = appraised_value  // for refinances

constraints:
  - maximum ltv per loan program (see decision table)
\`\`\`

### Formula: PMI Rate

\`\`\`
annual_pmi_rate = base_rate × ltv_factor × credit_factor

where:
  base_rate = 0.003 (0.3%)
  ltv_factor = 1.0 (LTV ≤ 85%), 1.5 (85-90%), 2.0 (90-95%), 2.5 (95-97%)
  credit_factor = 0.8 (score ≥ 760), 1.0 (720-759), 1.3 (680-719), 1.8 (640-679), 2.5 (620-639)

monthly_pmi = (loan_amount × annual_pmi_rate) / 12
\`\`\`

## 4. Threshold Rules

| Rule | Metric | Threshold | Action When Exceeded | Cooldown |
|------|--------|-----------|---------------------|----------|
| High-value loan | Loan amount | > $726,200 (2025 conforming limit) | Flag as jumbo, different program rules | N/A |
| Suspicious income | Stated vs. verified income | > 20% variance | Flag for income verification | Per application |
| Multiple applications | Applications per SSN in 30 days | > 2 | Flag for fraud review | 30-day window |
| Property flip | Prior sale within 90 days | Price increase > 20% | Require two appraisals | Per property |

## 5. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| loan_amount | > 0 AND ≤ conforming_limit (unless jumbo) | "Loan amount must be between $1 and $726,200 for conforming" |
| credit_score | 300-850 integer | "Credit score must be between 300 and 850" |
| dti_ratio | 0-100, max 2 decimals | "DTI ratio out of valid range" |
| property_value | > $10,000 | "Property value must exceed $10,000" |
| borrower_age | ≥ 18 years | "Borrower must be at least 18 years old" |

---
*AI Agent Guidance: Implement decision tables as lookup functions. Implement formulas as pure functions with exact parameters. Threshold rules should be configurable. Generate unit tests for each rule with boundary values (e.g., credit score 619 vs 620, DTI 42.9% vs 43.1%).*`,
      content_hash: "",
      tags: ["business-rules", "eligibility", "pricing", "mortgage"],
    });

    const deploymentSpec = makeNode("SpecDocument", "spec", {
      name: "LoanOS Deployment Spec",
      description: "Infrastructure, CI/CD, health checks, and observability for the LoanOS platform",
      spec_type: "deployment",
      format: "markdown",
      content: `# Deployment Specification — LoanOS

## 1. Overview

**Application:** LoanOS Loan Origination System
**Environment:** Production (AWS us-east-1)
**Deployment Model:** Kubernetes (EKS) with Helm charts

## 2. Infrastructure

### Compute

| Component | Type | Specs | Count | Auto-Scale |
|-----------|------|-------|-------|------------|
| Application Service | K8s Deployment | 2 CPU, 4GB RAM | 3 min, 12 max | CPU > 70% or RPS > 500/pod |
| Eligibility Service | K8s Deployment | 1 CPU, 2GB RAM | 2 min, 8 max | CPU > 70% |
| Document Service | K8s Deployment | 2 CPU, 4GB RAM | 2 min, 6 max | CPU > 60% (PDF generation CPU-heavy) |
| Credit Bureau Adapter | K8s Deployment | 1 CPU, 2GB RAM | 2 min, 4 max | Queue depth > 50 |
| Notification Service | K8s Deployment | 0.5 CPU, 1GB RAM | 1 min, 4 max | Kafka lag > 1000 |
| API Gateway (Kong) | K8s DaemonSet | 1 CPU, 2GB RAM | 1 per node | N/A |

### Storage

| Component | Type | Size | Backup | Retention |
|-----------|------|------|--------|-----------|
| Primary DB | RDS PostgreSQL 15 | 500GB, gp3 | Automated daily + WAL | 30 days snapshots, 7 days WAL |
| Redis Cache | ElastiCache r7g.large | 13GB | N/A | Volatile |
| Kafka | MSK m5.large × 3 | 1TB per broker | N/A | 7 days topic retention |
| Documents | S3 | Unlimited | Versioned | Lifecycle: 1yr IA, 7yr Glacier |
| Logs | CloudWatch | Auto | N/A | 90 days hot, 1 year cold storage |

### Networking

- **Load Balancer:** AWS ALB (external) + NLB (internal gRPC)
- **DNS:** Route53 — \`api.loanos.acmebank.com\`, TTL: 60s
- **CDN:** CloudFront for borrower portal static assets
- **VPC:** Private subnets for all services, public subnet for ALB only
- **TLS:** ACM certificates, auto-renewal, TLS 1.3

## 3. Health Checks

| Check | Endpoint | Interval | Timeout | Unhealthy After | Healthy After |
|-------|----------|----------|---------|-----------------|---------------|
| Liveness | /healthz | 10s | 3s | 3 failures | 1 success |
| Readiness | /readyz | 5s | 3s | 2 failures | 2 successes |
| Deep health | /healthz/deep | 30s | 10s | 2 failures → alert | 1 success |

**Readiness checks include:** PostgreSQL connection, Redis ping, Kafka producer health

## 4. Observability

### Metrics (Prometheus → Datadog)

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|----------------|
| http_requests_total | Counter | method, path, status, service | — |
| http_request_duration_seconds | Histogram | method, path, service | p99 > 2s (app), > 500ms (eligibility) |
| application_created_total | Counter | loan_type, channel | — |
| application_state_transition_total | Counter | from_state, to_state | — |
| credit_pull_duration_seconds | Histogram | bureau, status | p99 > 30s |
| db_query_duration_seconds | Histogram | query_type, table | p99 > 1s |
| kafka_consumer_lag | Gauge | topic, consumer_group | > 5000 for 5min |

### Logging (Structured JSON → CloudWatch → Datadog)

- **Fields:** timestamp, level, message, service, trace_id, span_id, request_id, user_id
- **PII Masking:** SSN, DOB, credit scores masked in all log output
- **Alert Routing:** error → PagerDuty, warn → Slack #loanos-alerts

### Tracing (OpenTelemetry → Datadog APM)

- **Sample Rate:** 100% for errors, 10% for normal traffic, 100% for latency > 2s
- **Propagation:** W3C trace-context headers

## 5. CI/CD Pipeline

### Build (GitHub Actions)

\`\`\`
1. Checkout code
2. Install dependencies (pnpm, cached)
3. Run ESLint + Prettier check
4. Run tsc --noEmit
5. Run unit tests (Jest, parallel)
6. Run integration tests (testcontainers)
7. Build Docker images (multi-stage, distroless)
8. Push to ECR (tag: git SHA + branch)
9. Trivy security scan (block on CRITICAL)
10. SonarQube quality gate
\`\`\`

### Deploy

| Stage | Trigger | Strategy | Rollback |
|-------|---------|----------|----------|
| Dev | Push to main | Rolling update | Auto — previous image |
| Staging | After dev tests pass | Blue-green | Auto — switch target group |
| Production | Manual approval (2 reviewers) | Canary: 5% → 25% → 50% → 100% | Auto if error rate > 0.5% or p99 > 3s |

**Canary Evaluation:** Each stage runs 10 minutes, Datadog monitors evaluate metrics before promotion

### Rollback Procedure

1. Automatic: Canary metrics breach threshold → Argo Rollouts auto-rollback
2. Manual: \`kubectl argo rollouts abort <rollout>\` or Argo CD UI
3. Database: Rollback migration if schema changed (tested in staging first)
4. Post-mortem: Required within 48 hours for any production rollback

## 6. Environment Variables

| Variable | Description | Required | Secret |
|----------|-------------|----------|--------|
| DATABASE_URL | PostgreSQL connection string | Yes | Yes |
| REDIS_URL | Redis connection string | Yes | Yes |
| KAFKA_BROKERS | Comma-separated broker list | Yes | No |
| CREDIT_BUREAU_API_KEY | Bureau aggregator API key | Yes | Yes |
| CREDIT_BUREAU_CERT | mTLS client certificate (base64) | Yes | Yes |
| JWT_PUBLIC_KEY | JWT verification key | Yes | Yes |
| LOG_LEVEL | Logging verbosity | No (default: info) | No |
| ENABLE_CANARY_FEATURES | Feature flag for canary | No (default: false) | No |

---
*AI Agent Guidance: Use this spec to generate Kubernetes manifests (Deployments, Services, HPAs), Helm values, GitHub Actions workflows, Dockerfiles, and health check endpoints. Match the exact metrics names for Prometheus instrumentation.*`,
      content_hash: "",
      tags: ["deployment", "infrastructure", "kubernetes", "ci-cd"],
    });

    // ── Create all nodes ──
    console.log("Inserting nodes...");
    const allNodes = [
      // Business layer
      retailLending, mortgageOrigination, mortgageService,
      applicationProcess, step1, step2, step3, step4,
      loanApplication, borrowerProfile, creditReport,
      // Glossary terms
      dtiRatio, ltvRatio, ssn, loanType,
      // Application layer
      loanOS, appService, eligibilityService, creditAdapter,
      createAppAPI, getAppAPI, eligibilityAPI,
      // Physical data layer
      pgDataStore, redisDataStore, kafkaDataStore, s3DataStore,
      loanAppTable, borrowersTable, creditReportsTable,
      loanAppType, kafkaTopic, createAppPayload,
      fieldId, fieldBorrowerId, fieldLoanAmount, fieldLoanType,
      fieldStatus, fieldDtiRatio, fieldLtvRatio,
      // Spec layer — original
      openAPISpec, erdSpec, testSpec,
      // Spec layer — new templates
      complianceSpec, architectureSpec, dataModelSpec, stateSpec,
      workflowSpec, apiInternalSpec, apiExternalSpec,
      uiSpec, businessRulesSpec, deploymentSpec,
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
      // Business decomposition
      { type: "COMPOSES", from: retailLending.id, to: mortgageOrigination.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step1.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step2.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step3.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step4.id },

      // Realizes
      { type: "REALIZES", from: mortgageService.id, to: retailLending.id },
      { type: "REALIZES", from: mortgageService.id, to: mortgageOrigination.id },
      { type: "REALIZES", from: loanOS.id, to: mortgageService.id },
      { type: "REALIZES", from: appService.id, to: applicationProcess.id },
      { type: "REALIZES", from: createAppAPI.id, to: appService.id },
      { type: "REALIZES", from: getAppAPI.id, to: appService.id },
      { type: "REALIZES", from: eligibilityAPI.id, to: eligibilityService.id },

      // Serves
      { type: "SERVES", from: mortgageService.id, to: retailLending.id },

      // Application decomposition
      { type: "COMPOSES", from: loanOS.id, to: appService.id },
      { type: "COMPOSES", from: loanOS.id, to: eligibilityService.id },
      { type: "COMPOSES", from: loanOS.id, to: creditAdapter.id },

      // Data access
      { type: "ACCESSES", from: createAppAPI.id, to: loanApplication.id, props: { access_type: "write" } },
      { type: "ACCESSES", from: getAppAPI.id, to: loanApplication.id, props: { access_type: "read" } },

      // Process step flow
      { type: "FLOWS_TO", from: step1.id, to: step2.id },
      { type: "FLOWS_TO", from: step2.id, to: step3.id },
      { type: "FLOWS_TO", from: step3.id, to: step4.id },

      // Dependencies
      { type: "DEPENDS_ON", from: appService.id, to: eligibilityService.id },
      { type: "DEPENDS_ON", from: appService.id, to: creditAdapter.id },

      // Original specs
      { type: "SPECIFIED_BY", from: createAppAPI.id, to: openAPISpec.id },
      { type: "SPECIFIED_BY", from: getAppAPI.id, to: openAPISpec.id },
      { type: "SPECIFIED_BY", from: loanApplication.id, to: erdSpec.id },
      { type: "SPECIFIED_BY", from: borrowerProfile.id, to: erdSpec.id },
      { type: "SPECIFIED_BY", from: creditReport.id, to: erdSpec.id },
      { type: "TESTED_BY", from: appService.id, to: testSpec.id },

      // New template specs → attached to relevant nodes

      // Compliance & Security → Retail Lending capability + data entities
      { type: "SPECIFIED_BY", from: retailLending.id, to: complianceSpec.id },
      { type: "SPECIFIED_BY", from: borrowerProfile.id, to: complianceSpec.id },
      { type: "SPECIFIED_BY", from: creditReport.id, to: complianceSpec.id },

      // Architecture → LoanOS application
      { type: "SPECIFIED_BY", from: loanOS.id, to: architectureSpec.id },

      // Data Model → data entities
      { type: "SPECIFIED_BY", from: loanApplication.id, to: dataModelSpec.id },
      { type: "SPECIFIED_BY", from: borrowerProfile.id, to: dataModelSpec.id },
      { type: "SPECIFIED_BY", from: creditReport.id, to: dataModelSpec.id },

      // State Management → application process + application service
      { type: "SPECIFIED_BY", from: applicationProcess.id, to: stateSpec.id },
      { type: "SPECIFIED_BY", from: appService.id, to: stateSpec.id },

      // Workflow → application process
      { type: "SPECIFIED_BY", from: applicationProcess.id, to: workflowSpec.id },

      // Internal API → Application Service + API endpoints
      { type: "SPECIFIED_BY", from: appService.id, to: apiInternalSpec.id },
      { type: "SPECIFIED_BY", from: createAppAPI.id, to: apiInternalSpec.id },
      { type: "SPECIFIED_BY", from: getAppAPI.id, to: apiInternalSpec.id },

      // External API → Credit Bureau Adapter
      { type: "SPECIFIED_BY", from: creditAdapter.id, to: apiExternalSpec.id },

      // UI Spec → Mortgage Application Service + Step 1
      { type: "SPECIFIED_BY", from: mortgageService.id, to: uiSpec.id },
      { type: "SPECIFIED_BY", from: step1.id, to: uiSpec.id },

      // Business Rules → Mortgage Origination capability + Eligibility Service
      { type: "SPECIFIED_BY", from: mortgageOrigination.id, to: businessRulesSpec.id },
      { type: "SPECIFIED_BY", from: eligibilityService.id, to: businessRulesSpec.id },
      { type: "SPECIFIED_BY", from: eligibilityAPI.id, to: businessRulesSpec.id },
      { type: "SPECIFIED_BY", from: eligibilityAPI.id, to: apiInternalSpec.id },

      // Deployment → LoanOS application
      { type: "SPECIFIED_BY", from: loanOS.id, to: deploymentSpec.id },

      // ── Glossary ASSOCIATED_WITH relationships ──

      // DTI Ratio → data entities, processes, APIs, services
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: loanApplication.id },
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: borrowerProfile.id },
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: step3.id },
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: eligibilityAPI.id },
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: eligibilityService.id },
      { type: "ASSOCIATED_WITH", from: dtiRatio.id, to: mortgageOrigination.id },

      // LTV Ratio → data entities, processes, APIs
      { type: "ASSOCIATED_WITH", from: ltvRatio.id, to: loanApplication.id },
      { type: "ASSOCIATED_WITH", from: ltvRatio.id, to: step3.id },
      { type: "ASSOCIATED_WITH", from: ltvRatio.id, to: eligibilityAPI.id },
      { type: "ASSOCIATED_WITH", from: ltvRatio.id, to: eligibilityService.id },
      { type: "ASSOCIATED_WITH", from: ltvRatio.id, to: mortgageOrigination.id },

      // SSN → data entities, process steps, APIs
      { type: "ASSOCIATED_WITH", from: ssn.id, to: borrowerProfile.id },
      { type: "ASSOCIATED_WITH", from: ssn.id, to: step1.id },
      { type: "ASSOCIATED_WITH", from: ssn.id, to: step2.id },
      { type: "ASSOCIATED_WITH", from: ssn.id, to: createAppAPI.id },
      { type: "ASSOCIATED_WITH", from: ssn.id, to: creditAdapter.id },

      // Loan Type → data entities, services, capabilities
      { type: "ASSOCIATED_WITH", from: loanType.id, to: loanApplication.id },
      { type: "ASSOCIATED_WITH", from: loanType.id, to: mortgageService.id },
      { type: "ASSOCIATED_WITH", from: loanType.id, to: mortgageOrigination.id },
      { type: "ASSOCIATED_WITH", from: loanType.id, to: createAppAPI.id },

      // ── Physical Data Layer relationships ──

      // Application COMPOSES DataStores
      { type: "COMPOSES", from: loanOS.id, to: pgDataStore.id },
      { type: "COMPOSES", from: loanOS.id, to: redisDataStore.id },
      { type: "COMPOSES", from: loanOS.id, to: kafkaDataStore.id },
      { type: "COMPOSES", from: loanOS.id, to: s3DataStore.id },

      // DataStore COMPOSES DataObjects
      { type: "COMPOSES", from: pgDataStore.id, to: loanAppTable.id },
      { type: "COMPOSES", from: pgDataStore.id, to: borrowersTable.id },
      { type: "COMPOSES", from: pgDataStore.id, to: creditReportsTable.id },
      { type: "COMPOSES", from: kafkaDataStore.id, to: kafkaTopic.id },

      // DataObject COMPOSES DataFields (loan_applications fields)
      { type: "COMPOSES", from: loanAppTable.id, to: fieldId.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldBorrowerId.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldLoanAmount.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldLoanType.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldStatus.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldDtiRatio.id },
      { type: "COMPOSES", from: loanAppTable.id, to: fieldLtvRatio.id },

      // DataObject REALIZES DataEntity (physical → logical)
      { type: "REALIZES", from: loanAppTable.id, to: loanApplication.id },
      { type: "REALIZES", from: borrowersTable.id, to: borrowerProfile.id },
      { type: "REALIZES", from: creditReportsTable.id, to: creditReport.id },

      // ApplicationComponent ACCESSES DataObject
      { type: "ACCESSES", from: appService.id, to: loanAppTable.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: appService.id, to: borrowersTable.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: creditAdapter.id, to: creditReportsTable.id, props: { access_type: "write" } },

      // API ACCESSES DataObject
      { type: "ACCESSES", from: createAppAPI.id, to: createAppPayload.id, props: { access_type: "read" } },

      // ApplicationComponent DEPENDS_ON DataStore
      { type: "DEPENDS_ON", from: appService.id, to: pgDataStore.id },
      { type: "DEPENDS_ON", from: appService.id, to: redisDataStore.id },
      { type: "DEPENDS_ON", from: appService.id, to: kafkaDataStore.id },

      // Data lineage: FLOWS_TO between DataObjects
      { type: "FLOWS_TO", from: createAppPayload.id, to: loanAppType.id },
      { type: "FLOWS_TO", from: loanAppType.id, to: loanAppTable.id },
      { type: "FLOWS_TO", from: loanAppTable.id, to: kafkaTopic.id },
    ];

    for (const rel of rels) {
      const relId = uuidv4();
      const relProps: Record<string, unknown> = {
        id: relId,
        valid_from: now,
        valid_to: null,
        created_by: "seed",
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
    console.log("\nKey node IDs:");
    console.log(`  Retail Lending:        ${retailLending.id}`);
    console.log(`  Mortgage Origination:  ${mortgageOrigination.id}`);
    console.log(`  LoanOS:                ${loanOS.id}`);
    console.log(`  Create App API:        ${createAppAPI.id}`);
    console.log(`\nNew spec IDs:`);
    console.log(`  Compliance & Security: ${complianceSpec.id}`);
    console.log(`  Architecture:          ${architectureSpec.id}`);
    console.log(`  Data Model:            ${dataModelSpec.id}`);
    console.log(`  State Management:      ${stateSpec.id}`);
    console.log(`  Workflow:              ${workflowSpec.id}`);
    console.log(`  Internal API:          ${apiInternalSpec.id}`);
    console.log(`  External API:          ${apiExternalSpec.id}`);
    console.log(`  UI Spec:               ${uiSpec.id}`);
    console.log(`  Business Rules:        ${businessRulesSpec.id}`);
    console.log(`  Deployment:            ${deploymentSpec.id}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
