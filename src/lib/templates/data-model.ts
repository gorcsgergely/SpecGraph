export const metadata = {
  name: "Data Model",
  description: "Database schema definition with entities, relationships, indexes, constraints, and evolution strategy",
  suggestedFormat: "markdown" as const,
};

export const content = `# Data Model Specification

## 1. Overview

**Domain:** [Which business domain this data model serves]
**Storage:** [PostgreSQL / MongoDB / Neo4j / etc.]
**Naming Convention:** [snake_case / camelCase — specify]

## 2. Entities

### [Entity Name]

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| [name] | VARCHAR(255) | — | — | No | — | UNIQUE within [scope] |
| [status] | ENUM | — | — | No | 'active' | CHECK IN ('active','archived') |
| [parent_id] | UUID | — | FK→[parent_table].id | Yes | NULL | ON DELETE SET NULL |
| [amount] | DECIMAL(12,2) | — | — | No | 0.00 | CHECK >= 0 |
| created_at | TIMESTAMPTZ | — | — | No | NOW() | — |
| updated_at | TIMESTAMPTZ | — | — | No | NOW() | — |

**Business Rules:**
- [e.g. "Name must be unique within the same parent scope"]
- [e.g. "Amount cannot be negative"]
- [e.g. "Status transitions: active → archived (one-way)"]

### [Entity Name 2]

| Field | Type | PK | FK | Nullable | Default | Constraints |
|-------|------|----|----|----------|---------|-------------|
| id | UUID | PK | — | No | gen_random_uuid() | — |
| [field] | [type] | — | — | [Yes/No] | [default] | [constraints] |

## 3. Relationships

\`\`\`mermaid
erDiagram
    ENTITY_A ||--o{ ENTITY_B : "has many"
    ENTITY_B }o--|| ENTITY_C : "belongs to"
    ENTITY_A ||--o{ ENTITY_C : "owns"
\`\`\`

| Relationship | From | To | Cardinality | On Delete |
|-------------|------|-----|-------------|-----------|
| [has many] | [Entity A] | [Entity B] | 1:N | CASCADE |
| [belongs to] | [Entity B] | [Entity C] | N:1 | RESTRICT |
| [many-to-many] | [Entity A] | [Entity C] | M:N via [join_table] | CASCADE |

## 4. Indexes

| Table | Index Name | Columns | Type | Purpose |
|-------|-----------|---------|------|---------|
| [entity_a] | idx_entity_a_name | name | UNIQUE | Name lookups |
| [entity_a] | idx_entity_a_status | status, created_at | B-TREE | Status filtering + sorting |
| [entity_b] | idx_entity_b_parent | parent_id | B-TREE | FK lookups |
| [entity_a] | idx_entity_a_search | name, description | GIN/FTS | Full-text search |

## 5. Constraints & Validation

- **Unique Constraints:** [List compound unique constraints]
- **Check Constraints:** [List CHECK constraints beyond column-level]
- **Trigger-Based Rules:** [Any triggers for computed fields, audit, etc.]
- **Application-Level Validation:** [Rules enforced in code, not DB]

## 6. Schema Evolution Strategy

- **Migration Tool:** [Prisma / Knex / Flyway / manual SQL]
- **Versioning:** [Sequential numbering / timestamp-based]
- **Backwards Compatibility:** [How breaking changes are handled]
- **Rollback Strategy:** [Down migrations / snapshot restore]

## 7. Seed Data

[List any reference data, lookup tables, or initial seed data required]

| Table | Key Records |
|-------|------------|
| [roles] | admin, operator, viewer |
| [statuses] | draft, active, archived |

---
*AI Agent Guidance: Use the entity tables to generate database migrations, ORM models, and TypeScript types. Pay attention to constraints and business rules for validation logic. Use the ER diagram to understand join patterns for queries.*
`;
