/**
 * Seed script: Creates a banking example graph
 * Retail Lending → Mortgage Origination → LoanOS → APIs
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
      example_request: '{"borrower": {"ssn": "123-45-6789", "firstName": "John", "lastName": "Doe"}, "property": {"address": "123 Main St"}, "loanAmount": 350000, "loanType": "conventional"}',
      example_response: '{"applicationId": "a1b2c3d4-...", "status": "received", "preQualEligible": true}',
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

    // ── Spec Layer ──
    console.log("Creating spec documents...");

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
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplicationResponse'
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
        loanType: { type: string, enum: [conventional, fha, va, usda] }
    ApplicationResponse:
      type: object
      properties:
        applicationId: { type: string, format: uuid }
        status: { type: string }
        preQualEligible: { type: boolean }`,
      content_hash: "",
      tags: ["openapi", "mortgage", "api"],
    });

    const erdSpec = makeNode("SpecDocument", "spec", {
      name: "Loan Application ERD",
      description: "Entity-relationship diagram for loan application data model",
      spec_type: "erd",
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

    // ── Create all nodes ──
    console.log("Inserting nodes...");
    const allNodes = [
      retailLending, mortgageOrigination, mortgageService,
      applicationProcess, step1, step2, step3, step4,
      loanApplication, borrowerProfile, creditReport,
      loanOS, appService, eligibilityService, creditAdapter,
      createAppAPI, getAppAPI, eligibilityAPI,
      openAPISpec, erdSpec, testSpec,
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

    const rels = [
      // Business decomposition
      { type: "COMPOSES", from: retailLending.id, to: mortgageOrigination.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step1.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step2.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step3.id },
      { type: "COMPOSES", from: applicationProcess.id, to: step4.id },

      // Realizes
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
      { type: "ACCESSES", from: appService.id, to: loanApplication.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: appService.id, to: borrowerProfile.id, props: { access_type: "read_write" } },
      { type: "ACCESSES", from: creditAdapter.id, to: creditReport.id, props: { access_type: "write" } },
      { type: "ACCESSES", from: createAppAPI.id, to: loanApplication.id, props: { access_type: "write" } },
      { type: "ACCESSES", from: getAppAPI.id, to: loanApplication.id, props: { access_type: "read" } },

      // Process step flow
      { type: "FLOWS_TO", from: step1.id, to: step2.id },
      { type: "FLOWS_TO", from: step2.id, to: step3.id },
      { type: "FLOWS_TO", from: step3.id, to: step4.id },

      // Dependencies
      { type: "DEPENDS_ON", from: appService.id, to: eligibilityService.id },
      { type: "DEPENDS_ON", from: appService.id, to: creditAdapter.id },

      // Specs
      { type: "SPECIFIED_BY", from: createAppAPI.id, to: openAPISpec.id },
      { type: "SPECIFIED_BY", from: getAppAPI.id, to: openAPISpec.id },
      { type: "SPECIFIED_BY", from: loanApplication.id, to: erdSpec.id },
      { type: "SPECIFIED_BY", from: borrowerProfile.id, to: erdSpec.id },
      { type: "SPECIFIED_BY", from: creditReport.id, to: erdSpec.id },
      { type: "TESTED_BY", from: appService.id, to: testSpec.id },
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
  } finally {
    await session.close();
    await driver.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
