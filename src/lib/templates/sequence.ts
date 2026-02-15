export const metadata = {
  name: "Sequence Diagram",
  description: "Mermaid sequence diagram template for documenting interactions between actors, services, and systems",
  suggestedFormat: "markdown" as const,
};

export const content = `# Sequence Diagram — [Interaction Name]

## 1. Context

**Trigger:** [What initiates this interaction]
**Actors:** [List of participants]
**Outcome:** [What the interaction produces]

## 2. Sequence

\`\`\`mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as API Gateway
    participant Svc as Service
    participant DB as Database

    User->>UI: Initiate action
    UI->>API: POST /api/resource
    API->>Svc: Validate & process
    Svc->>DB: Query/Write
    DB-->>Svc: Result
    Svc-->>API: Response
    API-->>UI: 201 Created
    UI-->>User: Show confirmation

    Note over Svc,DB: Transaction boundary

    alt Success path
        Svc->>Svc: Publish event
    else Error path
        Svc-->>API: 400/500 Error
        API-->>UI: Error response
        UI-->>User: Show error message
    end
\`\`\`

## 3. Participants

| Participant | Type | Responsibility |
|-------------|------|----------------|
| User | Actor | Initiates the interaction |
| Frontend | System | Handles UI and user input |
| API Gateway | System | Routes, authenticates, rate-limits |
| Service | System | Business logic and orchestration |
| Database | System | Data persistence |

## 4. Key Interactions

| # | From | To | Message | Protocol | Notes |
|---|------|----|---------|----------|-------|
| 1 | User | Frontend | Initiate action | UI event | — |
| 2 | Frontend | API | POST /api/resource | REST/JSON | Includes auth token |
| 3 | API | Service | Process request | Internal | After auth validation |
| 4 | Service | Database | Query/Write | SQL/Cypher | Within transaction |

## 5. Error Scenarios

| Scenario | At Step | Response | Recovery |
|----------|---------|----------|----------|
| Auth failure | 2→3 | 401 Unauthorized | Redirect to login |
| Validation error | 3 | 400 Bad Request | Show field errors |
| DB timeout | 4 | 500 Internal Error | Retry with backoff |
| Downstream unavailable | 3→4 | 503 Service Unavailable | Circuit breaker, queue for retry |

---
*AI Agent Guidance: Replace placeholder participants with actual system components. Add loop/alt/opt blocks for conditional flows. Include timeout and retry annotations where applicable.*
`;
