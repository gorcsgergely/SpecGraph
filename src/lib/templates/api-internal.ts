export const metadata = {
  name: "Internal API",
  description: "Internal service API contract with endpoints, request/response schemas, auth, rate limits, and error codes",
  suggestedFormat: "markdown" as const,
};

export const content = `# Internal API Specification

## 1. Overview

**Service:** [Service name]
**Base Path:** [/api/v1/resource]
**Protocol:** [REST / gRPC / GraphQL]
**Authentication:** [JWT / API Key / mTLS — specify mechanism]

## 2. Endpoints

### \`POST /api/v1/[resource]\`

**Description:** [Create a new resource]
**Auth Required:** [Yes — role: admin, operator]

**Request:**
\`\`\`json
{
  "name": "string (required, 1-255 chars)",
  "type": "string (required, enum: ['typeA', 'typeB'])",
  "config": {
    "key": "string (optional)"
  }
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "config": {},
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
\`\`\`

**Guarantees:**
- Idempotent: [No / Yes with idempotency key]
- Consistency: [Strong / Eventual]

---

### \`GET /api/v1/[resource]/:id\`

**Description:** [Retrieve a single resource]
**Auth Required:** [Yes — role: any authenticated]

**Path Params:**
- \`id\` — UUID of the resource

**Response (200):**
\`\`\`json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "config": {},
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
\`\`\`

---

### \`GET /api/v1/[resource]\`

**Description:** [List resources with pagination]
**Auth Required:** [Yes — role: any authenticated]

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| limit | int | 20 | Items per page (max 100) |
| sort | string | created_at | Sort field |
| order | string | desc | asc or desc |
| filter | string | — | Filter expression |

**Response (200):**
\`\`\`json
{
  "data": [{ "id": "uuid", "..." : "..." }],
  "total": 142,
  "page": 1,
  "limit": 20
}
\`\`\`

---

### \`PUT /api/v1/[resource]/:id\`

**Description:** [Update a resource]
**Auth Required:** [Yes — role: admin, operator]

**Request:** [Same shape as POST, all fields optional]

**Response (200):** [Updated resource object]

**Guarantees:**
- Optimistic locking: [Yes — via \`version\` field / ETag]

---

### \`DELETE /api/v1/[resource]/:id\`

**Description:** [Soft-delete a resource]
**Auth Required:** [Yes — role: admin]

**Response (204):** No content

## 3. Authentication & Authorization

- **Mechanism:** [Bearer JWT in Authorization header]
- **Token Source:** [Auth service / Identity provider]
- **Role Enforcement:** [Middleware checks role claim against endpoint requirements]
- **Service-to-Service:** [mTLS / Internal API key / Service mesh identity]

## 4. Rate Limits

| Scope | Limit | Window | Burst |
|-------|-------|--------|-------|
| Per client | [100 req] | [1 minute] | [20 req] |
| Per endpoint | [50 req] | [1 minute] | [10 req] |
| Global | [10,000 req] | [1 minute] | [500 req] |

**Rate Limit Headers:** \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`

## 5. Error Responses

| Status | Code | Description | Example |
|--------|------|-------------|---------|
| 400 | VALIDATION_ERROR | Invalid request body | \`{"error": "VALIDATION_ERROR", "details": [{"field": "name", "message": "required"}]}\` |
| 401 | UNAUTHORIZED | Missing or invalid auth | \`{"error": "UNAUTHORIZED"}\` |
| 403 | FORBIDDEN | Insufficient permissions | \`{"error": "FORBIDDEN", "required_role": "admin"}\` |
| 404 | NOT_FOUND | Resource not found | \`{"error": "NOT_FOUND"}\` |
| 409 | CONFLICT | Version conflict | \`{"error": "CONFLICT", "current_version": 3}\` |
| 429 | RATE_LIMITED | Too many requests | \`{"error": "RATE_LIMITED", "retry_after": 30}\` |
| 500 | INTERNAL_ERROR | Unexpected error | \`{"error": "INTERNAL_ERROR", "trace_id": "abc123"}\` |

---
*AI Agent Guidance: Use the endpoint definitions to generate route handlers, request validation schemas, and TypeScript types. Implement error responses exactly as specified. Apply rate limiting and auth middleware as described.*
`;
