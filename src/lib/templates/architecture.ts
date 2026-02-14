export const metadata = {
  name: "Architecture",
  description: "System architecture overview including layers, services, data flow, scalability, and resilience patterns",
  suggestedFormat: "markdown" as const,
};

export const content = `# Architecture Specification

## 1. Overview

**System:** [System name]
**Purpose:** [One-line summary of what this architecture describes]
**Architecture Style:** [Monolith / Microservices / Event-driven / Serverless / Hybrid]

## 2. System Layers

\`\`\`mermaid
graph TD
    subgraph Presentation
        UI[Web UI]
        Mobile[Mobile App]
        API_GW[API Gateway]
    end
    subgraph Application
        SvcA[Service A]
        SvcB[Service B]
        SvcC[Service C]
    end
    subgraph Data
        DB[(Primary DB)]
        Cache[(Cache)]
        Queue[Message Queue]
    end

    UI --> API_GW
    Mobile --> API_GW
    API_GW --> SvcA
    API_GW --> SvcB
    SvcA --> DB
    SvcA --> Cache
    SvcB --> Queue
    Queue --> SvcC
    SvcC --> DB
\`\`\`

## 3. Services

| Service | Responsibility | Tech Stack | Communication | SLA |
|---------|---------------|------------|---------------|-----|
| [Service A] | [Core business logic] | [Node.js / TypeScript] | [REST / gRPC] | [99.9% uptime] |
| [Service B] | [Event processing] | [Python] | [Async / Kafka] | [99.5% uptime] |
| [Service C] | [Data aggregation] | [Go] | [gRPC] | [99.9% uptime] |

## 4. Data Layer

### 4.1 Primary Storage
- **Technology:** [PostgreSQL / MongoDB / Neo4j]
- **Schema Strategy:** [Migrations / Schema-on-read]
- **Partitioning:** [By tenant / By date / None]

### 4.2 Caching
- **Technology:** [Redis / Memcached]
- **Strategy:** [Write-through / Write-behind / Cache-aside]
- **TTL Policy:** [Per entity type, specify defaults]

### 4.3 Messaging
- **Technology:** [Kafka / RabbitMQ / SQS]
- **Topics/Queues:** [List key topics and their consumers]
- **Ordering Guarantees:** [Per partition / Per queue / None]
- **Dead Letter Policy:** [Max retries, DLQ destination]

## 5. Scalability

- **Horizontal Scaling:** [Which services scale horizontally, autoscaling triggers]
- **Load Balancing:** [Strategy — round-robin, least-connections, consistent hashing]
- **Rate Limiting:** [Per-client, per-endpoint, global]
- **Expected Load:** [Peak RPS, concurrent users, data volume growth]

## 6. Resilience

- **Circuit Breakers:** [Which inter-service calls have circuit breakers, thresholds]
- **Retries:** [Retry policy — max attempts, backoff strategy]
- **Timeouts:** [Per-service timeout budgets]
- **Fallbacks:** [Graceful degradation strategies per service]
- **Health Checks:** [Liveness, readiness probes — intervals and thresholds]

## 7. Cross-Cutting Concerns

- **Authentication:** [Central auth service / JWT validation at gateway]
- **Observability:** [Tracing (Jaeger/Zipkin), Metrics (Prometheus), Logs (ELK)]
- **Configuration:** [Environment-based / Config service / Feature flags]
- **Service Discovery:** [DNS / Consul / K8s service]

---
*AI Agent Guidance: Use the Mermaid diagram and service table to understand system boundaries. When generating code for a specific service, reference the tech stack, communication patterns, and resilience policies. Implement circuit breakers and retries as specified.*
`;
