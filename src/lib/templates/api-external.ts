export const metadata = {
  name: "External API Integration",
  description: "Third-party API integration spec with endpoints, timeout/fallback strategies, circuit breakers, and SLOs",
  suggestedFormat: "markdown" as const,
};

export const content = `# External API Integration Specification

## 1. Overview

**Integration:** [Name of external service / API]
**Provider:** [Company / service name]
**Purpose:** [Why we integrate — data enrichment, payment processing, etc.]
**Documentation:** [Link to provider API docs]

## 2. Integrations

### Integration: [Service Name]

| Endpoint | Method | Purpose | Request Format | Response Format |
|----------|--------|---------|---------------|-----------------|
| [/v1/verify] | POST | [Identity verification] | JSON | JSON |
| [/v1/status/:id] | GET | [Check verification status] | — | JSON |
| [/v1/webhook] | POST (inbound) | [Async result callback] | JSON | — |

**Authentication:**
- **Method:** [API Key / OAuth2 Client Credentials / HMAC]
- **Credentials Location:** [Header: X-API-Key / Bearer token / Query param]
- **Key Rotation:** [Manual / Automatic — frequency]

**Base URLs:**
- Production: \`[https://api.provider.com/v1]\`
- Sandbox: \`[https://sandbox.api.provider.com/v1]\`

### Request Example
\`\`\`json
{
  "reference_id": "our-internal-id",
  "data": {
    "field": "value"
  }
}
\`\`\`

### Response Example
\`\`\`json
{
  "id": "provider-id",
  "status": "completed",
  "result": {
    "score": 85,
    "decision": "approved"
  }
}
\`\`\`

## 3. Timeout & Fallback Strategy

| Operation | Timeout | Retry Policy | Fallback |
|-----------|---------|-------------|----------|
| [/v1/verify] | [5s] | [3 retries, exponential backoff: 1s, 2s, 4s] | [Queue for async processing] |
| [/v1/status/:id] | [3s] | [2 retries, 500ms fixed] | [Return cached status] |
| [Webhook receipt] | [N/A — inbound] | [Provider retries 3x over 1h] | [Poll status endpoint] |

**Backoff Configuration:**
- Initial delay: [1 second]
- Multiplier: [2x]
- Max delay: [30 seconds]
- Jitter: [Yes — ±20%]

## 4. Circuit Breaker

| Parameter | Value |
|-----------|-------|
| Failure threshold | [5 failures in 60 seconds] |
| Open duration | [30 seconds] |
| Half-open probes | [1 request] |
| Success threshold to close | [3 consecutive successes] |
| Monitored errors | [5xx responses, timeouts, connection errors] |

**When circuit is open:**
- [Return cached data if available (max age: 5 minutes)]
- [Queue request for retry when circuit closes]
- [Alert ops team via PagerDuty]

## 5. Service Level Objectives

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| Availability | [99.9%] | [5-minute rolling window] | [< 99.5%] |
| Latency (p50) | [200ms] | [Per-request] | [> 500ms] |
| Latency (p99) | [2s] | [Per-request] | [> 5s] |
| Error rate | [< 0.1%] | [5-minute rolling] | [> 1%] |

## 6. Event Topics

| Event | Topic / Channel | Payload | Consumer |
|-------|----------------|---------|----------|
| [Verification completed] | [events.verification.completed] | [{ id, status, result }] | [Order service] |
| [Provider webhook received] | [events.external.webhook] | [{ provider, event_type, data }] | [Integration service] |
| [Circuit breaker state change] | [events.circuit.state] | [{ service, old_state, new_state }] | [Monitoring] |

## 7. Data Mapping

| Our Field | Provider Field | Transform |
|-----------|---------------|-----------|
| [user_id] | [reference_id] | [Direct map] |
| [full_name] | [first_name + last_name] | [Concatenate with space] |
| [score] | [result.confidence] | [Multiply by 100, round] |

---
*AI Agent Guidance: Implement HTTP client wrappers with the specified timeouts, retry policies, and circuit breaker configuration. Use the data mapping table to generate request/response transformation functions. Implement fallback strategies as described.*
`;
