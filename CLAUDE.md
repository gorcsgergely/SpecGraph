# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Neo4j (required before dev server or seed)
docker compose up -d

# Install dependencies
eval "$(/opt/homebrew/bin/brew shellenv)" && npm install

# Development server (http://localhost:3000)
npm run dev

# Initialize Neo4j schema (constraints, indexes, full-text index)
# Requires dev server running
npm run db:schema

# Seed banking example data (21 nodes, 30+ relationships)
npm run seed

# Build for production
npm run build

# Lint
npm run lint

# Type check only
npx tsc --noEmit
```

Neo4j browser is at http://localhost:7474 (credentials: neo4j / specgraph-dev).

## Architecture

Enterprise architecture knowledge graph (ArchiMate-inspired). Neo4j stores 9 node types across 3 layers connected by 10 relationship types with temporal versioning.

### Data Flow

**API routes** (`src/app/api/`) → **query functions** (`src/lib/neo4j/queries/`) → **Neo4j driver** (`src/lib/neo4j/driver.ts`) → Neo4j

- `executeQuery<T>()` for reads, `executeWrite<T>()` for writes — both handle session lifecycle and deserialize Neo4j types (integers, datetimes, node labels) to plain JS via `toPlainValue()`.
- All nodes have temporal properties (`valid_from`, `valid_to`, `version`). Current nodes: `valid_to IS NULL`. Historical: `valid_from <= asOf AND (valid_to IS NULL OR valid_to > asOf)`.

### Copy-on-Write Updates

`updateNode()` in `src/lib/neo4j/queries/nodes.ts`:
1. Sets `valid_to = now` on current node
2. Creates new node with new UUID, incremented version
3. Migrates all active relationships (both directions) to new node — this is per-relationship-type since Cypher can't dynamically create relationship types

### Type System

`src/lib/types/graph.ts` defines:
- Zod schemas for all 9 node types (use `import { z } from "zod/v4"`)
- `ALLOWED_RELATIONSHIPS` matrix — validated at relationship creation time in `src/lib/neo4j/queries/relationships.ts`
- `NodeSchemaMap` maps node type strings to their Zod schemas
- Layer color coding constants for UI

### Validation Engine

`src/lib/validation/` — 9 advisory rules defined as Cypher queries in `rules.ts`, orchestrated by `engine.ts`. Rules are warnings/info only, never blocking. The `invalid_rel` check validates against `ALLOWED_RELATIONSHIPS`.

### Export System

`src/lib/export/` — `traverseSubgraph()` does N-hop BFS from a root node, then `generateMarkdownExport()` produces structured markdown with auto-generated Mermaid diagrams, node properties grouped by layer, relationship tables, embedded spec content, and validation warnings.

### UI Patterns

- SWR hooks in `src/lib/hooks/use-graph.ts` wrap all API calls
- `NodeForm` (`src/components/nodes/NodeForm.tsx`) is a single dynamic form for all 9 node types, driven by per-type field metadata
- Graph visualization is a custom canvas-based force-directed layout (no external graph library)
- Spec editor uses Monaco Editor with split-pane Mermaid preview

## Key Gotchas

- **Node.js path**: Run `eval "$(/opt/homebrew/bin/brew shellenv)"` before npm/node commands in shell
- **React 19 strict typing**: `useRef()` requires initial value. `{unknown && JSX}` is a type error — use `{x ? JSX : null}`. Wrap unknown values in `String()` before rendering.
- **Neo4j driver records**: Use `any` type for `result.records.map()` callbacks — the driver's generic types are too complex for explicit typing
- **Next.js 15 params**: Page `params` is `Promise<T>` — use `React.use(params)` or `await params`
- **`useSearchParams()`**: Must wrap component in `<Suspense>` or build fails
