"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNodes, useAllRelationships } from "@/lib/hooks/use-graph";
import { GraphExplorer } from "@/components/graph/GraphExplorer";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { NodeForm } from "@/components/nodes/NodeForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { NodeType as NodeTypeEnum } from "@/lib/types/graph";

// Persist selected node across page navigations
let cachedSelectedNodeId: string | null = null;

function GraphPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string | undefined>>({
    nodeType: searchParams.get("nodeType") || undefined,
    layer: searchParams.get("layer") || undefined,
    status: searchParams.get("status") || undefined,
  });
  const [search, setSearch] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(cachedSelectedNodeId);
  const [showCreate, setShowCreate] = useState(
    searchParams.get("create") === "true"
  );

  const queryParams: Record<string, string> = {};
  if (filters.nodeType) queryParams.nodeType = filters.nodeType;
  if (filters.layer) queryParams.layer = filters.layer;
  if (filters.status) queryParams.status = filters.status;
  if (search) queryParams.search = search;

  const { data, mutate } = useNodes(queryParams);
  const nodes = (data?.nodes || []).map((n: Record<string, unknown>) => ({
    id: n.id as string,
    name: n.name as string,
    nodeType: n.nodeType as NodeTypeEnum,
    layer: n.layer as string,
    status: n.status as string,
  }));

  const { data: rels } = useAllRelationships();
  const nodeIds = new Set(nodes.map((n) => n.id));
  const allRelationships = (rels || [])
    .filter((r) => nodeIds.has(r.source_id) && nodeIds.has(r.target_id))
    .map((r) => ({
      id: r.id || "",
      type: r.type,
      source_id: r.source_id,
      target_id: r.target_id,
    }));

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      router.push(`/graph/${nodeId}`);
    },
    [router]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => {
      const next = prev === nodeId ? null : nodeId;
      cachedSelectedNodeId = next;
      return next;
    });
  }, []);

  const handleCreateSuccess = () => {
    setShowCreate(false);
    mutate();
  };

  return (
    <div className="flex h-full">
      <GraphFilters filters={filters} onFilterChange={setFilters} />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {nodes.length} nodes
          </span>
          <div className="ml-auto">
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Node
            </Button>
          </div>
        </div>
        <div className="flex-1 relative">
          {nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p>No nodes found.</p>
                <p className="text-sm mt-1">
                  Create your first node or adjust filters.
                </p>
              </div>
            </div>
          ) : (
            <GraphExplorer
              nodes={nodes}
              relationships={allRelationships}
              onNodeClick={handleNodeClick}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId || undefined}
            />
          )}
        </div>
      </div>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Node</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <NodeForm onSuccess={handleCreateSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense>
      <GraphPageInner />
    </Suspense>
  );
}
