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
# Requires dev server running — hits POST /api/schema
npm run db:schema

# Seed banking example data (21 nodes, 31 relationships)
npm run seed

# Build for production
npm run build

# Lint
npm run lint

# Type check only
npx tsc --noEmit
```

Neo4j browser: http://localhost:7474 (credentials: `neo4j` / `specgraph-dev`)

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS v4 + shadcn/ui (19 components)
- **Database:** Neo4j 5 Community (Docker)
- **Driver:** `neo4j-driver` v5
- **Forms:** react-hook-form + Zod v4
- **Data fetching:** SWR
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Diagrams:** Mermaid.js
- **Icons:** lucide-react

## Architecture

Enterprise architecture knowledge graph (ArchiMate-inspired). Neo4j stores 9 node types across 3 layers connected by 10 relationship types with temporal versioning.

### Layers & Node Types

- **Business:** BusinessCapability, BusinessService, BusinessProcess, ProcessStep, DataEntity
- **Application:** Application, ApplicationComponent, API
- **Spec:** SpecDocument

### Relationship Types

COMPOSES, REALIZES, SERVES, ACCESSES, FLOWS_TO, TRIGGERS, DEPENDS_ON, SPECIFIED_BY, TESTED_BY, IMPLEMENTED_BY — validated against `ALLOWED_RELATIONSHIPS` matrix in `src/lib/types/graph.ts`.

### Data Flow

```
UI (SWR hooks) → API routes → query functions → Neo4j driver → Neo4j
```

- `executeQuery<T>()` for reads, `executeWrite<T>()` for writes in `src/lib/neo4j/driver.ts`
- Both handle session lifecycle and deserialize Neo4j types (integers, datetimes, node labels) to plain JS via `toPlainValue()`

### Copy-on-Write Versioning

`updateNode()` in `src/lib/neo4j/queries/nodes.ts`:
1. Sets `valid_to = now` on current node
2. Creates new node with new UUID, incremented version
3. Migrates all active relationships (both directions) to new node — per-relationship-type since Cypher can't dynamically create relationship types

Temporal queries: current = `valid_to IS NULL`, historical = `valid_from <= asOf AND (valid_to IS NULL OR valid_to > asOf)`

## Project Structure

```
src/
  app/
    page.tsx                          # Dashboard
    graph/
      page.tsx                        # Graph explorer (canvas-based force layout)
      [nodeId]/page.tsx               # Node detail view
      [nodeId]/edit/page.tsx          # Node editor
    specs/[specId]/page.tsx           # Spec editor (Monaco + Mermaid preview)
    search/page.tsx                   # Full-text search
    timeline/page.tsx                 # Time-travel view
    export/page.tsx                   # Markdown export for AI agents
    validation/page.tsx               # Validation dashboard
    api/
      nodes/                          # CRUD + relationships, specs, history per node
      relationships/                  # All relationships + per-rel CRUD
      specs/[specId]/                 # Spec CRUD
      graph/traverse/                 # N-hop BFS subgraph traversal
      graph/temporal/                 # Time-travel queries
      search/                         # Full-text search
      export/                         # Markdown export
      validation/                     # Advisory validation
      schema/                         # POST to init Neo4j constraints/indexes
  lib/
    neo4j/
      driver.ts                       # Singleton driver + executeQuery/executeWrite
      temporal.ts                     # Temporal predicate helpers
      schema.ts                       # Constraint/index creation
      queries/                        # nodes.ts, relationships.ts, traversal.ts, search.ts
    types/graph.ts                    # All types, Zod schemas, relationship matrix, colors
    validation/                       # rules.ts (9 Cypher rules) + engine.ts
    export/                           # markdown.ts + mermaid.ts
    hooks/use-graph.ts                # SWR hooks for all API endpoints
  components/
    graph/
      GraphExplorer.tsx               # Canvas force-directed graph (custom, no library)
      GraphFilters.tsx                # Layer/type/status filter sidebar
    nodes/                            # NodeForm, NodeDetail, NodeRelationships, NodeHistory
    specs/                            # SpecEditor (Monaco), SpecPreview (Mermaid)
    search/                           # SearchBar, SearchResults
    export/                           # ExportConfigurator, ExportPreview
    validation/                       # ValidationDashboard
    ui/                               # shadcn/ui primitives
scripts/
  seed.ts                             # Banking example seed data
```

## Key Gotchas

- **Node.js path (macOS):** Run `eval "$(/opt/homebrew/bin/brew shellenv)"` before npm/node commands
- **Zod v4 import:** Use `import { z } from "zod/v4"` (not `"zod"`)
- **React 19 strict typing:**
  - `useRef()` requires initial value — use `useRef<T>(null)` or `useRef<number>(0)`
  - `{unknown && JSX}` is a type error — use ternary `{x ? <JSX/> : null}`
  - Render unknown values with `String(value)` wrapping
- **Neo4j integers:** Use `neo4j.int(n)` for SKIP/LIMIT params — JS numbers are floats, Neo4j rejects them
- **Neo4j driver records:** Use `any` type for `result.records.map()` callbacks — driver generics are too complex
- **Next.js 15 params:** Route `params` is `Promise<T>` — use `await params` in async server components
- **`useSearchParams()`:** Component must be wrapped in `<Suspense>` or build fails
- **Graph explorer:** Uses refs (not React state) for all mutable data to avoid re-render loops; module-level `layoutCache` preserves positions across navigations
