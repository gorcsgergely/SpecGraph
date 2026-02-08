import { executeQuery } from "./driver";

const NODE_LABELS = [
  "BusinessCapability",
  "BusinessService",
  "BusinessProcess",
  "ProcessStep",
  "DataEntity",
  "Application",
  "ApplicationComponent",
  "API",
  "SpecDocument",
];

export async function initializeSchema(): Promise<void> {
  // Unique constraint on id for each node type
  for (const label of NODE_LABELS) {
    await executeQuery(
      `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`
    );
  }

  // Indexes for common query patterns
  for (const label of NODE_LABELS) {
    await executeQuery(
      `CREATE INDEX IF NOT EXISTS FOR (n:${label}) ON (n.valid_to)`
    );
    await executeQuery(
      `CREATE INDEX IF NOT EXISTS FOR (n:${label}) ON (n.status)`
    );
    await executeQuery(
      `CREATE INDEX IF NOT EXISTS FOR (n:${label}) ON (n.name)`
    );
  }

  // Full-text search index across all node types
  try {
    await executeQuery(
      `CREATE FULLTEXT INDEX node_fulltext IF NOT EXISTS
       FOR (n:BusinessCapability|BusinessService|BusinessProcess|ProcessStep|DataEntity|Application|ApplicationComponent|API|SpecDocument)
       ON EACH [n.name, n.description, n.tags]`
    );
  } catch {
    // Index may already exist
  }
}
