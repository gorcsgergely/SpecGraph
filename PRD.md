I want a tool that is helping users that want an AI coding agent to reliably build software from documentation, the key is to move from human-friendly prose toward a layered, machine-consumable specification system with strict structure, traceability, and progressive refinement. These specification should use some kind of markup language or makrdown files for most parts describing diagrams, flows, data models, ERD diagrams an other proven specification elements.
First I need the specification hierarchy and templates.
Use the askquestion tool to clarify requirements for this tool

  Phase 1: Foundation
  - Next.js 15 project with TypeScript, Tailwind v4, shadcn/ui (18 UI components)
  - Docker Compose for Neo4j 5 Community with APOC
  - Neo4j driver singleton with executeQuery/executeWrite helpers
  - TypeScript types for all 9 node types + relationship allowed matrix + Zod schemas
  - Schema initialization (constraints, indexes, full-text search index)
  - Node CRUD with copy-on-write temporal versioning + relationship migration
  - Relationship CRUD with type validation against allowed matrix
  - Subgraph traversal + full-text search queries
  - Seed script with full banking example (21 nodes, 30+ relationships)

  Phase 2: Graph Explorer + Node Editor
  - Canvas-based force-directed graph with pan/zoom/drag
  - Filter sidebar (layer, type, status) with color legend
  - Dynamic node form driven by per-type field definitions
  - Node detail page with properties, relationships table, attached specs, version history

  Phase 3: Spec Editor
  - Monaco editor with syntax highlighting (YAML/JSON/Markdown)
  - Split-pane with live Mermaid diagram preview
  - Editor/split/preview view toggle

  Phase 4: Temporal + Search + Export
  - Time-travel page with datetime picker
  - Full-text search with results linking to nodes
  - Markdown export engine with auto-generated Mermaid diagrams
  - Export UI with configurator (root node, depth, validation toggle) + copy/download

  Phase 5: Validation
  - 9 advisory validation rules as Cypher queries
  - Validation dashboard grouped by rule with severity counts
  - Inline node links from validation warnings

Bash(kill $(lsof -ti:3000) 2>/dev/null; cd "/Users/gorcsgergely/Documents/AI projects/SpecGraph" && docker compose down 2>&1 &&
      docker compose up -d 2>&1 | tail -3)
  ⎿   Container specgraph-neo4j-1  Stopping
      Container specgraph-neo4j-1  Stopped
      Container specgraph-neo4j-1  Removing
     … +6 lines (ctrl+o to expand)
  ⎿  (timeout 1m)

⏺ Bash(for i in $(seq 1 30); do if docker exec $(docker ps -q --filter "name=neo4j") cypher-shell -u neo4j -p specgraph-dev "RETURN
      1" 2>/dev/null | grep -q "1"; then…)
  ⎿  Neo4j ready

⏺ Bash(cd "/Users/gorcsgergely/Documents/AI projects/SpecGraph" && eval "$(/opt/homebrew/bin/brew shellenv)" && npm run seed 2>&1 |
      tail -8)
  ⎿  Seed complete! Created 21 nodes and 31 relationships.

     Key node IDs:
     … +4 lines (ctrl+o to expand)

⏺ Bash(cd "/Users/gorcsgergely/Documents/AI projects/SpecGraph" && eval "$(/opt/homebrew/bin/brew shellenv)" && npm run dev &
      sleep 4…)