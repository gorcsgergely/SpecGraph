export const metadata = {
  name: "Business Rules",
  description: "Decision tables, calculation formulas, threshold rules, and business logic specifications",
  suggestedFormat: "markdown" as const,
};

export const content = `# Business Rules Specification

## 1. Overview

**Domain:** [Which business area these rules govern]
**Owner:** [Business owner responsible for rule definitions]
**Effective Date:** [When these rules take effect]
**Review Cycle:** [How often rules are reviewed — quarterly, annually]

## 2. Decision Tables

### Decision: [Approval Routing]

**Description:** [Determines which approval path a request follows based on amount and risk]

| # | Amount | Risk Score | Customer Tier | → Approval Path | → SLA |
|---|--------|-----------|---------------|----------------|-------|
| 1 | < $100 | Any | Any | Auto-approve | Instant |
| 2 | $100 – $1,000 | Low (< 30) | Gold, Platinum | Auto-approve | Instant |
| 3 | $100 – $1,000 | Low (< 30) | Standard | Manager review | 4 hours |
| 4 | $100 – $1,000 | Medium (30-70) | Any | Manager review | 4 hours |
| 5 | $100 – $1,000 | High (> 70) | Any | Senior review | 2 hours |
| 6 | > $1,000 | Any | Any | Senior review + Compliance | 24 hours |

**Priority:** Rules are evaluated top-to-bottom; first match wins.
**Default:** If no rule matches → Senior review + Compliance

### Decision: [Pricing Tier]

| # | Volume (monthly) | Contract Length | Region | → Discount % | → Support Level |
|---|-----------------|----------------|--------|-------------|-----------------|
| 1 | > 10,000 | ≥ 2 years | Any | 25% | Premium |
| 2 | > 10,000 | < 2 years | Any | 15% | Standard |
| 3 | 1,000 – 10,000 | ≥ 1 year | Any | 10% | Standard |
| 4 | < 1,000 | Any | Any | 0% | Basic |

## 3. Formulas

### Formula: [Late Fee Calculation]

\`\`\`
late_fee = base_amount × rate × days_overdue

where:
  base_amount = outstanding balance at due date
  rate = 0.015 (1.5% per day)
  days_overdue = current_date - due_date (in business days)

constraints:
  - minimum late_fee = $5.00
  - maximum late_fee = min(base_amount × 0.25, $500.00)
  - cap at 25% of base_amount or $500, whichever is lower
\`\`\`

**Parameters:**

| Parameter | Type | Range | Source |
|-----------|------|-------|--------|
| base_amount | decimal(12,2) | > 0 | invoices.balance_due |
| rate | decimal(5,4) | 0.0001 – 0.1000 | config.late_fee_rate |
| days_overdue | integer | 0 – 365 | calculated |

### Formula: [Risk Score]

\`\`\`
risk_score = (w1 × transaction_frequency) + (w2 × amount_deviation) + (w3 × geo_risk)

where:
  w1 = 0.3, w2 = 0.5, w3 = 0.2
  transaction_frequency = transactions in last 24h / avg daily transactions
  amount_deviation = abs(amount - avg_amount) / std_dev_amount
  geo_risk = lookup(country, geo_risk_table)

output: normalized to 0-100
\`\`\`

## 4. Threshold Rules

| Rule | Metric | Threshold | Action When Exceeded | Cooldown |
|------|--------|-----------|---------------------|----------|
| [Daily limit] | Sum of transactions per user per day | [$10,000] | [Block + notify compliance] | [Reset at midnight UTC] |
| [Velocity check] | Transactions per user per hour | [20] | [Soft block + challenge] | [1 hour sliding window] |
| [Failed attempts] | Failed auth per account per 15min | [5] | [Lock account + notify user] | [15 min, manual unlock] |
| [Balance alert] | Account balance | [< $100] | [Send low balance warning] | [Once per 24h] |

## 5. Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| [email] | RFC 5322 format | "Invalid email format" |
| [phone] | E.164 format, 10-15 digits | "Invalid phone number" |
| [amount] | > 0, max 2 decimal places | "Amount must be positive with max 2 decimals" |
| [date_of_birth] | ≥ 18 years ago, ≤ 120 years ago | "Must be between 18 and 120 years old" |
| [account_number] | Luhn check + length 10-16 | "Invalid account number" |

## 6. Rule Dependencies

\`\`\`mermaid
graph LR
    A[Risk Score Calculation] --> B[Approval Routing]
    C[Customer Tier Lookup] --> B
    B --> D[SLA Assignment]
    A --> E[Threshold Checks]
    E --> F[Account Actions]
\`\`\`

---
*AI Agent Guidance: Implement decision tables as structured if/else chains or lookup functions. Implement formulas as pure functions with the exact parameters and constraints specified. Threshold rules should be implemented as configurable checks that can be adjusted without code changes. Generate unit tests for each rule with boundary values.*
`;
