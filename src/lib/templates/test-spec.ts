export const metadata = {
  name: "Test Specification",
  description: "Test strategy, test cases, coverage targets, automation patterns, and acceptance test scenarios",
  suggestedFormat: "markdown" as const,
};

export const content = `# Test Specification — [Component / Feature Name]

## 1. Overview

**Subject Under Test:** [What is being tested — component, API, process, feature]
**Owner:** [Team or individual responsible for test maintenance]
**Test Strategy:** [Unit / Integration / E2E / Contract / Performance — or combination]
**Coverage Target:** [e.g., 80% line coverage for unit, 100% happy-path for E2E]
**Dependencies:** [Test frameworks, fixtures, mock services, test databases]

## 2. Test Scope

### In Scope

- [Feature/behavior 1]
- [Feature/behavior 2]
- [Edge case category]

### Out of Scope

- [What is explicitly NOT tested here and why]
- [What is covered by other test specs]

## 3. Test Cases

### 3.1 Happy Path

| ID | Scenario | Input | Expected Output | Priority |
|----|----------|-------|-----------------|----------|
| TC-001 | [Normal operation] | [Valid input] | [Expected result] | P0 |
| TC-002 | [Normal operation variant] | [Valid input variant] | [Expected result] | P0 |
| TC-003 | [Alternate success path] | [Different valid input] | [Expected result] | P1 |

### 3.2 Error / Edge Cases

| ID | Scenario | Input | Expected Output | Priority |
|----|----------|-------|-----------------|----------|
| TC-010 | [Missing required field] | [Incomplete input] | [Error response / message] | P0 |
| TC-011 | [Invalid data type] | [Wrong type input] | [Validation error] | P1 |
| TC-012 | [Boundary value — minimum] | [Min value] | [Expected behavior at boundary] | P1 |
| TC-013 | [Boundary value — maximum] | [Max value] | [Expected behavior at boundary] | P1 |
| TC-014 | [Concurrent access] | [Simultaneous requests] | [Correct handling] | P2 |
| TC-015 | [Empty / null input] | [null / undefined / ""] | [Graceful handling] | P1 |

### 3.3 Security

| ID | Scenario | Input | Expected Output | Priority |
|----|----------|-------|-----------------|----------|
| TC-020 | [Unauthorized access] | [Missing/invalid auth] | [401/403 response] | P0 |
| TC-021 | [Injection attempt] | [Malicious input] | [Sanitized / rejected] | P0 |

## 4. Acceptance Tests

### [Feature / Requirement Name]

\`\`\`gherkin
Given [precondition — system state before test]
When [action — what the user or system does]
Then [assertion — observable outcome]
And [additional assertion]
\`\`\`

### [Another Feature / Requirement]

\`\`\`gherkin
Given [precondition]
And [additional precondition]
When [action]
Then [assertion]
But [negative assertion — what should NOT happen]
\`\`\`

## 5. Test Data

### Fixtures

| Fixture | Description | Location |
|---------|-------------|----------|
| [fixture-name] | [What data it provides] | [File path or generation method] |
| [seed-data] | [Database seed for integration tests] | [Script path] |

### Mocks / Stubs

| Dependency | Mock Strategy | Behavior |
|-----------|--------------|----------|
| [External API] | [HTTP mock / stub] | [Returns canned response for known inputs] |
| [Database] | [In-memory / test container] | [Seeded with fixtures above] |
| [Time] | [Frozen clock] | [Fixed to specific timestamp for deterministic tests] |

## 6. Automation

### Test Commands

\`\`\`bash
# Run all tests
[npm test / pytest / go test ./...]

# Run specific test suite
[npm test -- --grep "component name"]

# Run with coverage
[npm test -- --coverage]

# Run E2E tests
[npm run test:e2e]
\`\`\`

### CI Integration

| Stage | Tests Run | Blocking | Timeout |
|-------|----------|----------|---------|
| Pre-commit | [Linting + type check] | Yes | [30s] |
| PR check | [Unit + integration] | Yes | [5min] |
| Post-merge | [Full suite + E2E] | No (alert) | [15min] |
| Nightly | [Performance + security] | No (alert) | [30min] |

## 7. Coverage Matrix

| Component / Module | Unit | Integration | E2E | Current % | Target % |
|-------------------|------|------------|-----|-----------|----------|
| [Module A] | [Yes] | [Yes] | [No] | [72%] | [80%] |
| [Module B] | [Yes] | [No] | [Yes] | [65%] | [80%] |
| [Module C] | [Partial] | [Yes] | [Yes] | [50%] | [70%] |

---
*AI Agent Guidance: Use the test cases table (Section 3) to generate unit and integration tests — each row maps to one test. Acceptance tests (Section 4) in Given/When/Then format can be translated directly to test frameworks. Respect priority levels: P0 tests must pass before merge, P1 before release, P2 are best-effort. Use the fixtures and mocks (Section 5) to set up test state deterministically.*
`;
