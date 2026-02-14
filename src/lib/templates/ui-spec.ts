export const metadata = {
  name: "UI Specification",
  description: "User interface layouts, interaction patterns, responsive behavior, and data display specifications",
  suggestedFormat: "markdown" as const,
};

export const content = `# UI Specification

## 1. Overview

**Screen/Component:** [Name of the page, view, or component]
**Purpose:** [What the user accomplishes here]
**Entry Points:** [How user navigates here — URL, button click, menu item]

## 2. Layout

### Desktop (≥1024px)

\`\`\`
┌─────────────────────────────────────────────────┐
│  Header / Navigation                             │
├──────────┬──────────────────────────────────────┤
│          │                                        │
│  Sidebar │  Main Content Area                     │
│  (240px) │                                        │
│          │  ┌──────────────────────────────────┐  │
│  - Nav   │  │  [Component A]                   │  │
│  - Filter│  │                                  │  │
│  - Quick │  └──────────────────────────────────┘  │
│    Links │                                        │
│          │  ┌──────────────────────────────────┐  │
│          │  │  [Component B]                   │  │
│          │  │                                  │  │
│          │  └──────────────────────────────────┘  │
│          │                                        │
├──────────┴──────────────────────────────────────┤
│  Footer (optional)                               │
└─────────────────────────────────────────────────┘
\`\`\`

### Mobile (<768px)

\`\`\`
┌─────────────────────┐
│  Header + Hamburger  │
├─────────────────────┤
│                      │
│  [Component A]       │
│  (full width)        │
│                      │
├─────────────────────┤
│                      │
│  [Component B]       │
│  (full width)        │
│                      │
├─────────────────────┤
│  Bottom Nav          │
└─────────────────────┘
\`\`\`

## 3. Components

### Component A: [Data Table / List]

**Data Display:**

| Column | Type | Sortable | Filterable | Width |
|--------|------|----------|------------|-------|
| [Name] | Text + link | Yes | Yes (search) | flex |
| [Status] | Badge | Yes | Yes (dropdown) | 100px |
| [Created] | Relative date | Yes | Yes (date range) | 150px |
| [Actions] | Icon buttons | No | No | 80px |

**Empty State:** [Message and CTA when no data exists]
**Loading State:** [Skeleton rows / Spinner / Progressive load]
**Pagination:** [Infinite scroll / Page numbers / Load more button]

### Component B: [Form / Detail Panel]

**Fields:**

| Field | Input Type | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| [Name] | Text input | Yes | 1-255 chars | "Enter name" |
| [Type] | Select dropdown | Yes | Enum values | "Select type" |
| [Description] | Textarea | No | Max 2000 chars | "Optional description" |
| [Tags] | Multi-select / chips | No | Max 10 tags | "Add tags" |
| [Enabled] | Toggle switch | — | Boolean | — |

## 4. Interactions

| Action | Trigger | Behavior | Success State | Error State |
|--------|---------|----------|--------------|-------------|
| [Create item] | Click "Create" button | [Open modal, submit form] | [Toast "Created", add to list] | [Inline errors on form] |
| [Delete item] | Click trash icon | [Confirm dialog] | [Toast "Deleted", remove from list] | [Toast error message] |
| [Filter list] | Type in search / select filter | [Debounce 300ms, update list] | [Filtered results shown] | [Show "No results" state] |
| [Sort column] | Click column header | [Toggle asc/desc, update icon] | [Re-sorted list] | — |
| [Inline edit] | Double-click cell | [Cell becomes editable] | [Save on blur, show check] | [Revert, show error] |

## 5. States

| State | Visual | Data |
|-------|--------|------|
| Initial load | [Skeleton screen] | [Fetch from API] |
| Empty | [Illustration + "No items yet" + CTA button] | [Empty array] |
| Loaded | [Full data table/list] | [Array of items] |
| Loading more | [Spinner at bottom] | [Appending to existing] |
| Error | [Error banner with retry button] | [Previous data preserved] |
| Offline | [Gray overlay + offline message] | [Cached data if available] |

## 6. Accessibility

- **Keyboard Navigation:** [Tab order, focus management, keyboard shortcuts]
- **Screen Reader:** [ARIA labels, live regions for dynamic content]
- **Color Contrast:** [WCAG AA minimum, don't rely on color alone]
- **Focus Indicators:** [Visible focus rings on all interactive elements]

---
*AI Agent Guidance: Use the layout diagrams to set up page structure and responsive breakpoints. Implement the data display table with the exact columns, sorting, and filtering specified. Use the interactions table to wire up event handlers with the specified behaviors and states.*
`;
