export const metadata = {
  name: "Compliance & Security",
  description: "Regulatory compliance requirements, security controls, data protection, and audit requirements",
  suggestedFormat: "markdown" as const,
};

export const content = `# Compliance & Security Specification

## 1. Context

**Scope:** [Describe which system, service, or capability this compliance spec covers]
**Owner:** [Team or individual responsible]
**Last Reviewed:** [Date]

## 2. Regulatory Requirements

| Regulation | Requirement | Metric / Threshold | Evidence Required |
|------------|-------------|-------------------|-------------------|
| [e.g. GDPR Art. 17] | [Right to erasure] | [72h response time] | [Deletion audit log] |
| [e.g. PCI-DSS 3.4] | [Encrypt stored PAN] | [AES-256 minimum] | [Encryption config] |
| [e.g. SOX 302] | [Financial reporting controls] | [Quarterly attestation] | [Control test results] |

## 3. Security Controls

### 3.1 Authentication

- **Method:** [OAuth2 / SAML / API Key / mTLS]
- **MFA Required:** [Yes/No — specify contexts]
- **Session Policy:** [Timeout, max sessions, token rotation]
- **Identity Provider:** [Internal / External IdP]

### 3.2 Authorization

- **Model:** [RBAC / ABAC / Policy-based]
- **Roles:**
  | Role | Permissions | Data Scope |
  |------|------------|------------|
  | [admin] | [full CRUD] | [all tenants] |
  | [operator] | [read + execute] | [own tenant] |
  | [viewer] | [read-only] | [own tenant] |
- **Elevation Policy:** [How temporary elevated access is granted]

### 3.3 Encryption

- **At Rest:** [AES-256 / envelope encryption — specify key management]
- **In Transit:** [TLS 1.3 minimum / mTLS for service-to-service]
- **Key Rotation:** [Frequency and mechanism]
- **Secrets Management:** [Vault / KMS / environment-based]

### 3.4 Audit Logging

- **Events Captured:** [Login, data access, modification, deletion, permission changes]
- **Retention Period:** [e.g. 7 years for financial, 2 years for access logs]
- **Log Format:** [Structured JSON with correlation IDs]
- **Tamper Protection:** [Immutable log storage / append-only]

## 4. Data Protection

- **Classification:** [Public / Internal / Confidential / Restricted]
- **PII Fields:** [List specific fields containing PII]
- **Masking Rules:** [Which fields are masked in logs, exports, non-prod environments]
- **Data Residency:** [Geographic constraints on data storage]
- **Retention & Purge:** [Retention periods by data type, purge mechanism]

## 5. Threat Model

| Threat | Attack Vector | Likelihood | Impact | Mitigation |
|--------|--------------|------------|--------|------------|
| [Unauthorized data access] | [API without auth check] | [Medium] | [High] | [Auth middleware on all endpoints] |
| [SQL injection] | [User input in queries] | [Medium] | [Critical] | [Parameterized queries, input validation] |
| [Privilege escalation] | [Role manipulation] | [Low] | [Critical] | [Server-side role checks, audit logging] |

## 6. Validation & Testing

- [ ] Penetration test scheduled / completed
- [ ] OWASP Top 10 review
- [ ] Access control matrix verified
- [ ] Encryption at rest verified
- [ ] Audit log completeness verified
- [ ] Data purge mechanism tested
- [ ] Incident response plan documented

---
*AI Agent Guidance: Use this spec to generate security middleware, audit logging interceptors, encryption configurations, and compliance validation tests. Pay special attention to the role matrix and threat mitigations when generating authorization code.*
`;
