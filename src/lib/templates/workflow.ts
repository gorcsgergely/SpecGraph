export const metadata = {
  name: "Workflow",
  description: "Business process workflow with numbered steps, decision gateways, error handling, and state transitions",
  suggestedFormat: "markdown" as const,
};

export const content = `# Workflow Specification

## 1. Context

**Process:** [Process name]
**Trigger:** [What initiates this workflow — user action, scheduled event, external call]
**Outcome:** [Expected end state when workflow completes successfully]
**SLA:** [Expected completion time, e.g. "< 30 seconds for happy path"]

## 2. Actors

| Actor | Type | Role in Workflow |
|-------|------|-----------------|
| [Customer] | External user | Initiates request |
| [System] | Automated | Validates and processes |
| [Approver] | Internal user | Reviews and approves |
| [External API] | Third-party | Provides data/confirmation |

## 3. Workflow Steps

### Step 1: [Receive Request]
- **Actor:** [Customer]
- **Input:** [Request payload — describe fields]
- **Action:** [Validate input, create initial record]
- **Business Rules:**
  - [Rule 1: Field X is required when condition Y]
  - [Rule 2: Amount must not exceed limit Z]
- **Output:** [Validated request record]
- **Next:** Step 2

### Step 2: [Validate Against External Data]
- **Actor:** [System]
- **Input:** [Request record from Step 1]
- **Action:** [Call external service to verify data]
- **External Call:** [GET /api/external/verify — timeout: 5s]
- **Business Rules:**
  - [If verification score < threshold → reject]
- **Output:** [Enriched record with verification status]
- **Next:** Step 3 (if verified) / Step 6 (if rejected)

### Step 3: [Decision Gateway — Approval Required?]
- **Type:** Exclusive Gateway
- **Condition:**
  - Amount > $1000 → Step 4 (Manual Approval)
  - Amount ≤ $1000 → Step 5 (Auto-Approve)

### Step 4: [Manual Approval]
- **Actor:** [Approver]
- **Input:** [Request with verification data]
- **Action:** [Review and approve/reject]
- **Timeout:** [24 hours — escalate to manager if not actioned]
- **Output:** [Approval decision]
- **Next:** Step 5 (if approved) / Step 6 (if rejected)

### Step 5: [Execute Process]
- **Actor:** [System]
- **Input:** [Approved request]
- **Action:** [Execute core business logic]
- **Business Rules:**
  - [Rule: Deduct from balance before external call]
  - [Rule: Generate confirmation number]
- **Output:** [Completed record with confirmation]
- **Next:** Step 7

### Step 6: [Handle Rejection]
- **Actor:** [System]
- **Input:** [Rejected request + reason]
- **Action:** [Notify requester, log rejection reason, reverse any holds]
- **Output:** [Rejection notification sent]
- **Next:** End

### Step 7: [Send Confirmation]
- **Actor:** [System]
- **Input:** [Completed record]
- **Action:** [Send notification to all parties]
- **Output:** [Confirmation delivered]
- **Next:** End

## 4. Error Handling

| Error Scenario | At Step | Handling | Retry? | Compensation |
|---------------|---------|----------|--------|--------------|
| [External API timeout] | Step 2 | [Retry with backoff] | [3 retries, 1s/2s/4s] | [None — not yet committed] |
| [External API error 5xx] | Step 2 | [Retry with backoff] | [3 retries] | [None] |
| [Approval timeout] | Step 4 | [Escalate to manager] | [No] | [None] |
| [Execution failure] | Step 5 | [Compensate and notify] | [1 retry] | [Reverse balance deduction] |
| [Notification failure] | Step 7 | [Queue for retry] | [5 retries over 1h] | [None — process complete] |

## 5. State Diagram

\`\`\`mermaid
stateDiagram-v2
    [*] --> Received : Request submitted
    Received --> Validating : Begin validation
    Validating --> PendingApproval : Needs approval
    Validating --> Processing : Auto-approved
    Validating --> Rejected : Validation failed
    PendingApproval --> Processing : Approved
    PendingApproval --> Rejected : Denied
    Processing --> Completed : Success
    Processing --> Failed : Error
    Failed --> Processing : Retry
    Completed --> [*]
    Rejected --> [*]
\`\`\`

## 6. Data Flow

| Step | Reads | Writes | External Calls |
|------|-------|--------|---------------|
| Step 1 | — | [requests table] | — |
| Step 2 | [requests] | [requests.verification_status] | [External verify API] |
| Step 5 | [requests, balances] | [requests, balances, confirmations] | — |

---
*AI Agent Guidance: Implement each step as a separate function or handler. Use the decision gateways to generate branching logic. Implement error handling and retries exactly as specified in the table. Use the state diagram to track workflow progress.*
`;
