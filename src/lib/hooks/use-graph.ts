"use client";

import useSWR from "swr";
import type { GraphNode, Relationship } from "@/lib/types/graph";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNodes(params?: Record<string, string>) {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return useSWR<{ nodes: GraphNode[]; total: number }>(
    `/api/nodes${query}`,
    fetcher
  );
}

export function useNode(id: string | null) {
  return useSWR<GraphNode>(id ? `/api/nodes/${id}` : null, fetcher);
}

export function useNodeRelationships(id: string | null) {
  return useSWR<Array<Relationship & { source_name: string; target_name: string; source_type: string; target_type: string }>>(
    id ? `/api/nodes/${id}/relationships` : null,
    fetcher
  );
}

export function useNodeSpecs(id: string | null) {
  return useSWR(id ? `/api/nodes/${id}/specs` : null, fetcher);
}

export function useNodeHistory(id: string | null) {
  return useSWR<GraphNode[]>(id ? `/api/nodes/${id}/history` : null, fetcher);
}

export function useSearch(query: string) {
  return useSWR(
    query ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );
}

export function useTraversal(rootId: string | null, depth: number = 3) {
  return useSWR(
    rootId ? `/api/graph/traverse?rootId=${rootId}&depth=${depth}` : null,
    fetcher
  );
}

export function useValidation() {
  return useSWR("/api/validation", fetcher);
}

export function useAllRelationships() {
  return useSWR<Array<{ id: string; type: string; source_id: string; target_id: string }>>(
    "/api/relationships",
    fetcher
  );
}

export function useExport(rootId: string | null, depth: number = 3) {
  return useSWR(
    rootId ? `/api/export?rootId=${rootId}&depth=${depth}` : null,
    fetcher
  );
}
