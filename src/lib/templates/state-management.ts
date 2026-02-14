export const metadata = {
  name: "State Management",
  description: "State machines, lifecycle flows, transition rules, and concurrency constraints for business entities",
  suggestedFormat: "markdown" as const,
};

export const content = `# State Management Specification

## 1. Overview

**Entity:** [Which entity or process this state spec covers]
**Purpose:** [Why state management is needed — lifecycle tracking, workflow control, etc.]

## 2. State Entities

| Entity | States | Initial State | Terminal States |
|--------|--------|--------------|-----------------|
| [Order] | draft, submitted, processing, completed, cancelled | draft | completed, cancelled |
| [Payment] | pending, authorized, captured, refunded, failed | pending | captured, refunded, failed |

## 3. State Flows

### [Entity: Order]

\`\`\`mermaid
stateDiagram-v2
    [*] --> draft
    draft --> submitted : submit()
    submitted --> processing : approve()
    submitted --> cancelled : cancel()
    processing --> completed : fulfill()
    processing --> cancelled : cancel()
    completed --> [*]
    cancelled --> [*]
\`\`\`

**Transition Rules:**

| From | To | Trigger | Guard Conditions | Side Effects |
|------|-----|---------|-----------------|--------------|
| draft | submitted | submit() | [All required fields present] | [Send notification, create audit entry] |
| submitted | processing | approve() | [Approver has role=manager] | [Lock order, notify fulfillment] |
| submitted | cancelled | cancel() | [Order age < 24h] | [Release holds, notify customer] |
| processing | completed | fulfill() | [All items shipped] | [Send confirmation, update inventory] |
| processing | cancelled | cancel() | [No items shipped yet] | [Reverse inventory, refund payment] |

### [Entity: Payment]

\`\`\`mermaid
stateDiagram-v2
    [*] --> pending
    pending --> authorized : authorize()
    pending --> failed : decline()
    authorized --> captured : capture()
    authorized --> pending : void()
    captured --> refunded : refund()
    captured --> [*]
    refunded --> [*]
    failed --> [*]
\`\`\`

## 4. Concurrency & Synchronization

- **Locking Strategy:** [Optimistic (version field) / Pessimistic (row lock) / None]
- **Conflict Resolution:** [Last-write-wins / Merge / Reject]
- **Idempotency:** [How duplicate transition requests are handled]
- **Event Ordering:** [Guaranteed ordering requirements, if any]

## 5. Persistence

- **Storage:** [Where state is persisted — DB column, separate state table, event log]
- **History:** [Whether state transitions are logged — audit table, event sourcing]
- **Snapshot Frequency:** [If event-sourced, snapshot interval]

## 6. Error Handling

- **Invalid Transitions:** [Return error / Throw exception / Queue for retry]
- **Partial Failures:** [Compensating actions if side effects fail]
- **Timeout Handling:** [Auto-transition after timeout, e.g. pending → cancelled after 7 days]

---
*AI Agent Guidance: Use the state diagrams and transition tables to generate state machine implementations. Implement guard conditions as validation functions. Wire up side effects as event handlers or middleware. Use the concurrency section to choose locking strategy in code.*
`;
