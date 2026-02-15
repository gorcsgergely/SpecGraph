export const metadata = {
  name: "Business Requirement Specification",
  description: "Stakeholder needs, functional/non-functional requirements, acceptance criteria, success metrics, and traceability",
  suggestedFormat: "markdown" as const,
};

export const content = `# Business Requirement Specification

## 1. Overview

**Capability / Service:** [Which business capability or service this BRS covers]
**Owner:** [Business owner / product manager responsible]
**Stakeholders:** [List of stakeholders — executives, end users, operations, compliance, etc.]
**Business Drivers:** [Why this capability/service exists — market need, regulatory mandate, efficiency gain, etc.]
**Effective Date:** [When these requirements take effect]
**Review Cycle:** [How often requirements are reviewed — quarterly, annually]

## 2. Functional Requirements

| ID | Requirement | Priority | Rationale | Status |
|----|------------|----------|-----------|--------|
| FR-001 | [The system shall ...] | Must | [Why this is needed] | Draft |
| FR-002 | [The system shall ...] | Should | [Why this is needed] | Draft |
| FR-003 | [The system shall ...] | Could | [Why this is needed] | Draft |
| FR-004 | [The system shall ...] | Won't (this phase) | [Why deferred] | Deferred |

**Priority key (MoSCoW):**
- **Must** — Non-negotiable for launch
- **Should** — Important but not blocking
- **Could** — Desirable if time/budget allows
- **Won't** — Explicitly out of scope for this phase

## 3. Non-Functional Requirements

| Category | Requirement | Target | Measurement |
|----------|------------|--------|-------------|
| Performance | [Response time for key operations] | [< 500ms p95] | [APM / load testing] |
| Availability | [Uptime target] | [99.9%] | [Monitoring / SLA reports] |
| Security | [Authentication, authorization, data protection] | [Describe standard] | [Audit / pen testing] |
| Scalability | [Expected load growth] | [Handle 10x current load] | [Load testing] |
| Compliance | [Regulatory requirements] | [Describe standard] | [Audit] |
| Usability | [User experience expectations] | [Task completion < 3 clicks] | [Usability testing] |

## 4. Acceptance Criteria

### FR-001: [Requirement Name]

\`\`\`gherkin
Given [precondition]
When [action is performed]
Then [expected outcome]
And [additional outcome]
\`\`\`

### FR-002: [Requirement Name]

\`\`\`gherkin
Given [precondition]
When [action is performed]
Then [expected outcome]
\`\`\`

## 5. Constraints & Assumptions

### Constraints

- [Technology constraint — e.g., must integrate with existing system X]
- [Budget constraint — e.g., no additional infrastructure spend]
- [Timeline constraint — e.g., must launch before Q3]
- [Regulatory constraint — e.g., data must reside in region Y]

### Assumptions

- [Assumption about user behavior — e.g., users have modern browsers]
- [Assumption about data — e.g., existing data is clean and migrated]
- [Assumption about dependencies — e.g., upstream API will be stable]

## 6. Success Metrics

| KPI | Baseline | Target | Measurement Method | Review Frequency |
|-----|----------|--------|-------------------|------------------|
| [Adoption rate] | [Current state] | [Target %] | [Analytics] | [Monthly] |
| [Error rate] | [Current state] | [< X%] | [Monitoring] | [Weekly] |
| [Processing time] | [Current state] | [< X seconds] | [APM] | [Weekly] |
| [User satisfaction] | [Current NPS/CSAT] | [Target score] | [Survey] | [Quarterly] |

## 7. Dependencies

| Dependency | Type | Owner | Status | Impact if Delayed |
|-----------|------|-------|--------|-------------------|
| [Upstream service / API] | Technical | [Team] | [Active / Planned] | [Describe impact] |
| [Data migration] | Data | [Team] | [In progress] | [Describe impact] |
| [Third-party contract] | Business | [Procurement] | [Pending] | [Describe impact] |

## 8. Traceability Matrix

| Requirement | Business Service | Business Process | Application Component | Test Spec |
|------------|-----------------|-----------------|----------------------|-----------|
| FR-001 | [Service name] | [Process name] | [Component name] | [Test spec ref] |
| FR-002 | [Service name] | [Process name] | [Component name] | [Test spec ref] |
| FR-003 | [Service name] | [Process name] | [Component name] | [Test spec ref] |

---
*AI Agent Guidance: Use this specification to understand the business "what and why" before implementing. Functional requirements (Section 2) define scope — respect MoSCoW priorities. Acceptance criteria (Section 4) are testable conditions — generate tests from Given/When/Then blocks. Non-functional requirements (Section 3) set quality bars. The traceability matrix (Section 8) maps requirements to architecture nodes for impact analysis.*
`;
