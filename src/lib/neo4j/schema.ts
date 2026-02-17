import { executeQuery } from "./driver";

const NODE_LABELS = [
  "BusinessCapability",
  "BusinessService",
  "BusinessProcess",
  "ProcessStep",
  "DataEntity",
  "GlossaryTerm",
  "Application",
  "ApplicationComponent",
  "API",
  "DataStore",
  "DataObject",
  "DataField",
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
  // Drop and recreate to include GlossaryTerm fields
  try {
    await executeQuery(`DROP INDEX node_fulltext IF EXISTS`);
  } catch {
    // Index may not exist
  }
  try {
    await executeQuery(
      `CREATE FULLTEXT INDEX node_fulltext IF NOT EXISTS
       FOR (n:BusinessCapability|BusinessService|BusinessProcess|ProcessStep|DataEntity|GlossaryTerm|Application|ApplicationComponent|API|DataStore|DataObject|DataField|SpecDocument)
       ON EACH [n.name, n.description, n.tags, n.canonical_name, n.synonyms, n.definition, n.physical_name]`
    );
  } catch {
    // Index may already exist
  }
}
