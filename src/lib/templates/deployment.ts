export const metadata = {
  name: "Deployment",
  description: "Infrastructure, health checks, observability, CI/CD pipeline, and operational runbook",
  suggestedFormat: "markdown" as const,
};

export const content = `# Deployment Specification

## 1. Overview

**Application:** [Application name]
**Environment:** [Production / Staging / Development]
**Deployment Model:** [Containers / VMs / Serverless / Hybrid]

## 2. Infrastructure

### Compute

| Component | Type | Specs | Count | Auto-Scale |
|-----------|------|-------|-------|------------|
| [Web servers] | [Container / K8s pod] | [2 CPU, 4GB RAM] | [3 min, 10 max] | [CPU > 70%, RPS > 1000] |
| [Worker nodes] | [Container / K8s pod] | [4 CPU, 8GB RAM] | [2 min, 8 max] | [Queue depth > 100] |
| [Cron jobs] | [CronJob / Lambda] | [1 CPU, 2GB RAM] | [1] | [N/A] |

### Storage

| Component | Type | Size | Backup | Retention |
|-----------|------|------|--------|-----------|
| [Primary DB] | [RDS PostgreSQL / Cloud SQL] | [100GB, auto-expand] | [Daily snapshots] | [30 days] |
| [Cache] | [ElastiCache Redis] | [8GB] | [N/A] | [Volatile] |
| [Object storage] | [S3 / GCS] | [Unlimited] | [Versioned] | [Lifecycle policy: 90d archive] |
| [Log storage] | [CloudWatch / ELK] | [Auto] | [N/A] | [90 days hot, 1 year cold] |

### Networking

- **Load Balancer:** [ALB / NLB / Ingress controller]
- **DNS:** [Route53 / CloudDNS — TTL: 60s]
- **CDN:** [CloudFront / Fastly — for static assets]
- **VPC/Network:** [Private subnets for services, public for LB only]
- **TLS:** [ACM / Let's Encrypt — auto-renewal]

## 3. Health Checks

| Check | Endpoint | Interval | Timeout | Unhealthy After | Healthy After |
|-------|----------|----------|---------|-----------------|---------------|
| [Liveness] | [/healthz] | [10s] | [3s] | [3 failures] | [1 success] |
| [Readiness] | [/readyz] | [5s] | [3s] | [2 failures] | [2 successes] |
| [DB connectivity] | [/readyz] (checks DB) | [5s] | [2s] | [Included in readiness] | — |
| [Deep health] | [/healthz/deep] | [30s] | [10s] | [2 failures → alert] | [1 success] |

**Health Check Logic:**
- \`/healthz\` — Returns 200 if process is running (no dependency checks)
- \`/readyz\` — Returns 200 if all dependencies (DB, cache, queues) are reachable
- \`/healthz/deep\` — Full dependency check with response time measurement

## 4. Observability

### Metrics

| Metric | Type | Labels | Alert Threshold |
|--------|------|--------|----------------|
| [http_requests_total] | Counter | method, path, status | — |
| [http_request_duration_seconds] | Histogram | method, path | p99 > 5s |
| [db_query_duration_seconds] | Histogram | query_type | p99 > 2s |
| [queue_depth] | Gauge | queue_name | > 1000 for 5min |
| [error_rate] | Gauge | service | > 1% for 5min |

### Logging

- **Format:** [Structured JSON]
- **Fields:** [timestamp, level, message, trace_id, span_id, service, request_id]
- **Levels:** [error → PagerDuty, warn → Slack, info → log storage, debug → dev only]
- **Sensitive Data:** [Mask PII fields, never log credentials or tokens]

### Tracing

- **System:** [OpenTelemetry / Jaeger / Datadog APT]
- **Sample Rate:** [100% for errors, 10% for normal traffic]
- **Propagation:** [W3C trace-context headers]

## 5. CI/CD Pipeline

### Build

\`\`\`
1. Checkout code
2. Install dependencies (with cache)
3. Run linter
4. Run type checks
5. Run unit tests
6. Run integration tests
7. Build container image
8. Push to registry (tag: git SHA + branch)
9. Security scan (Trivy / Snyk)
\`\`\`

### Deploy

| Stage | Trigger | Strategy | Rollback |
|-------|---------|----------|----------|
| [Dev] | [Push to main] | [Replace] | [Auto — previous image] |
| [Staging] | [After dev passes] | [Blue-green] | [Auto — switch back] |
| [Production] | [Manual approval] | [Canary (10% → 50% → 100%)] | [Auto if error rate > 1%] |

### Rollback Procedure

1. [Detect: automated alert or manual observation]
2. [Decide: check error rate, latency, business metrics]
3. [Execute: revert to previous image / traffic shift]
4. [Verify: confirm rollback successful, metrics normalized]
5. [Post-mortem: document root cause and prevention]

## 6. Environment Variables

| Variable | Description | Required | Default | Secret |
|----------|-------------|----------|---------|--------|
| [DATABASE_URL] | [Primary DB connection string] | Yes | — | Yes |
| [REDIS_URL] | [Cache connection string] | Yes | — | Yes |
| [API_KEY] | [External service API key] | Yes | — | Yes |
| [LOG_LEVEL] | [Logging verbosity] | No | info | No |
| [PORT] | [HTTP listen port] | No | 3000 | No |

---
*AI Agent Guidance: Use this spec to generate Dockerfiles, Kubernetes manifests, CI/CD pipeline configs (GitHub Actions, etc.), and health check endpoints. Implement observability with the exact metrics and logging format specified. Use environment variable table for configuration setup.*
`;
