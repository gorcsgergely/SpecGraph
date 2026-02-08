# SpecGraph — Key Learnings

## React 19 + TypeScript Strict Mode

### `useRef` requires an initial value
React 19 changed the `useRef` signature — calling `useRef<number>()` without an argument is a type error. Always pass an initial value:
```ts
// Bad
const ref = useRef<number>();

// Good
const ref = useRef<number>(0);
```

### `unknown && JSX` fails as ReactNode
When a value is typed as `unknown` (e.g. from `Record<string, unknown>`), using short-circuit rendering produces type `unknown`, which isn't assignable to `ReactNode`:
```tsx
// Bad — TS error: Type 'unknown' is not assignable to type 'ReactNode'
{node.description && <p>{String(node.description)}</p>}

// Good — ternary always produces ReactNode | null
{node.description ? <p>{String(node.description)}</p> : null}
```

### Rendering unknown values in JSX
Wrap all `unknown` values in `String()` before rendering. Even `{value as string}` isn't enough — the compiler still sees `unknown` at the expression level:
```tsx
// Bad
<Badge>{node.status as string}</Badge>

// Good
<Badge>{String(node.status)}</Badge>
```

## Neo4j Driver v5 (npm `neo4j-driver`)

### Record types are complex generics — use `any`
The `result.records.map()` callback has deeply nested generic types (`Record<RecordShape, PropertyKey, ...>`) that don't play well with explicit type annotations. Casting to `any` is the pragmatic choice:
```ts
// Bad — type mismatch on keys: PropertyKey[] vs string[]
result.records.map((record: { keys: string[]; get: (key: string) => unknown }) => { ... });

// Good
result.records.map((record: any) => {
  const obj: Record<string, unknown> = {};
  for (const key of record.keys) {
    obj[String(key)] = toPlainValue(record.get(key));
  }
  return obj as T;
});
```

### Neo4j integer conversion
Neo4j returns its own `Integer` type for numbers. Always convert with `neo4j.isInt(val) ? val.toNumber() : val` in a recursive serializer, or values like `version: 1` come back as `{ low: 1, high: 0 }`.

### Node labels as nodeType
Neo4j nodes store their type as a label (`labels` array), not a property. When deserializing, extract it:
```ts
if (nodeVal.labels) {
  props.nodeType = nodeVal.labels.find((l: string) => l !== "BaseNode");
}
```

## Copy-on-Write Versioning

### Relationship migration is the hard part
When a node is updated (copy-on-write), the new version gets a new UUID. All active relationships pointing to/from the old node must be:
1. Closed (`valid_to = now`)
2. Re-created pointing to the new node ID

This must handle both incoming and outgoing relationships, and since Cypher can't dynamically create relationship types, it requires per-type `CREATE` statements in application code.

### Querying current vs historical state
Two simple predicates cover all temporal queries:
```ts
// Current state
`n.valid_to IS NULL`

// As-of a point in time
`n.valid_from <= $asOf AND (n.valid_to IS NULL OR n.valid_to > $asOf)`
```

## Next.js 15 App Router

### Dynamic route params are now async
In Next.js 15, `params` in page components is a `Promise`:
```tsx
// Must await or use React.use()
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
}
```

### `useSearchParams` needs Suspense boundary
Components using `useSearchParams()` must be wrapped in `<Suspense>` or the build fails:
```tsx
function Inner() {
  const params = useSearchParams(); // needs Suspense
  // ...
}

export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
```

## Zod v4

### Import path changed
```ts
// Zod v4
import { z } from "zod/v4";

// Not the default "zod" path if using v4 features
```

## Graph Visualization Without Libraries

### Canvas-based force-directed layout
A simple force-directed graph can be built with plain `<canvas>` + `requestAnimationFrame`:
- **Repulsion** between all node pairs (inverse square law)
- **Attraction** along edges (spring force toward ideal distance)
- **Center gravity** to prevent drift
- **Damping** on velocity to settle

This avoids the weight of libraries like D3-force or Neo4j NVL while being good enough for ~50-100 nodes.

## Project Architecture Decisions

### Flat Record<string, unknown> over union types in components
While the Zod schemas define precise types per node, the UI components work with `Record<string, unknown>` because:
- Data comes from Neo4j as dynamic property bags
- The NodeForm handles all 9 types with a single component using field metadata
- String() wrapping is simpler than discriminated union narrowing in templates

### SWR for data fetching
SWR's `mutate()` function makes optimistic UI updates easy after CRUD operations without manual cache management. The hook pattern (`useNodes`, `useNode`, etc.) keeps API URLs centralized.

### Advisory-only validation
All validation rules are warnings/info, never blocking. This matches enterprise architecture reality — graphs are always incomplete and evolving. The validation dashboard surfaces issues without preventing work.
