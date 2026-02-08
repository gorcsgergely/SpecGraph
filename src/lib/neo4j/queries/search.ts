import { executeQuery } from "../driver";
import { currentPredicate } from "../temporal";
import type { GraphNode } from "../../types/graph";

export interface SearchResult {
  node: GraphNode;
  score: number;
}

export async function fullTextSearch(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  try {
    const result = await executeQuery<{ n: GraphNode; score: number }>(
      `CALL db.index.fulltext.queryNodes("node_fulltext", $query)
       YIELD node as n, score
       WHERE ${currentPredicate("n")}
       RETURN n, score
       ORDER BY score DESC
       LIMIT $limit`,
      { query, limit }
    );
    return result.map((r) => ({ node: r.n, score: r.score }));
  } catch {
    // Fallback to CONTAINS search if fulltext index doesn't exist
    return containsSearch(query, limit);
  }
}

export async function containsSearch(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  const result = await executeQuery<{ n: GraphNode }>(
    `MATCH (n)
     WHERE ${currentPredicate("n")}
       AND (toLower(n.name) CONTAINS toLower($query)
         OR toLower(n.description) CONTAINS toLower($query))
     RETURN n
     ORDER BY n.name
     LIMIT $limit`,
    { query, limit }
  );
  return result.map((r, i) => ({ node: r.n, score: 1.0 - i * 0.01 }));
}
