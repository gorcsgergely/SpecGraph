export const metadata = {
  name: "Implementation Spec",
  description: "Implementation specification with overview, file/component structure, key functions, code patterns, and gotchas",
  suggestedFormat: "markdown" as const,
};

export const content = `# Implementation Specification — [Component Name]

## 1. Overview

**Component:** [Name]
**File(s):** [Primary file path(s)]
**Purpose:** [What this component does and why it exists]
**Dependencies:** [Key imports and external dependencies]

## 2. File / Component Structure

| File | Responsibility | Exports |
|------|----------------|---------|
| [path/to/file.ts] | [What it does] | [Key exports] |
| [path/to/helper.ts] | [What it does] | [Key exports] |

## 3. Key Functions

### [functionName]()

\`\`\`typescript
// Signature
export async function functionName(
  param1: Type1,
  param2: Type2
): Promise<ReturnType> { ... }
\`\`\`

**Purpose:** [What this function does]
**Parameters:**
- \`param1\` — [Description]
- \`param2\` — [Description]

**Returns:** [What it returns and when it returns null/throws]

**Key Logic:**
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

**Edge Cases:**
- [Edge case 1 and how it's handled]
- [Edge case 2 and how it's handled]

## 4. Code Patterns

### [Pattern Name]

**Where:** [Which functions/files use this pattern]
**Why:** [Why this pattern was chosen over alternatives]
**How:**

\`\`\`typescript
// Example of the pattern in use
\`\`\`

**Constraints:**
- [Constraint 1 — e.g., "must be called within a transaction"]
- [Constraint 2 — e.g., "input is validated upstream by Zod"]

## 5. Gotchas

| Gotcha | Impact | Mitigation |
|--------|--------|------------|
| [Non-obvious behavior] | [What goes wrong] | [How to avoid it] |
| [Framework quirk] | [What goes wrong] | [How to avoid it] |
| [Type system issue] | [What goes wrong] | [How to avoid it] |

---
*AI Agent Guidance: Use the function signatures and key logic steps to understand how to call and extend this component. Pay attention to the gotchas section — these are the most common sources of bugs. Follow the established code patterns when adding new functionality.*
`;
