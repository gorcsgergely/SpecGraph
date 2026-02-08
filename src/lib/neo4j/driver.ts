import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "specgraph-dev";
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
}

export async function executeQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver();
  const session: Session = d.session();
  try {
    const result = await session.run(cypher, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.records.map((record: any) => {
      const obj: Record<string, unknown> = {};
      for (const key of record.keys) {
        obj[String(key)] = toPlainValue(record.get(key));
      }
      return obj as T;
    });
  } finally {
    await session.close();
  }
}

export async function executeWrite<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver();
  const session: Session = d.session();
  try {
    const result = await session.executeWrite((tx) =>
      tx.run(cypher, params)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.records.map((record: any) => {
      const obj: Record<string, unknown> = {};
      for (const key of record.keys) {
        obj[String(key)] = toPlainValue(record.get(key));
      }
      return obj as T;
    });
  } finally {
    await session.close();
  }
}

// Convert Neo4j types to plain JS values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlainValue(val: any): unknown {
  if (val === null || val === undefined) return val;
  if (neo4j.isInt(val)) return val.toNumber();
  if (neo4j.isDate(val) || neo4j.isDateTime(val) || neo4j.isLocalDateTime(val)) {
    return val.toString();
  }
  if (typeof val === "object" && val !== null && "properties" in val) {
    const props: Record<string, unknown> = {};
    const nodeVal = val as { properties: Record<string, unknown>; labels?: string[] };
    for (const [k, v] of Object.entries(nodeVal.properties)) {
      props[k] = toPlainValue(v);
    }
    if (nodeVal.labels) {
      props.nodeType = nodeVal.labels.find(
        (l: string) => l !== "BaseNode"
      );
    }
    return props;
  }
  if (Array.isArray(val)) return val.map(toPlainValue);
  return val;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
