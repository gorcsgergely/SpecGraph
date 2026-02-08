"use client";

import { use } from "react";
import Link from "next/link";
import { useNode, useNodeRelationships, useNodeSpecs, useNodeHistory } from "@/lib/hooks/use-graph";
import { NodeDetail } from "@/components/nodes/NodeDetail";
import { NodeRelationships } from "@/components/nodes/NodeRelationships";
import { NodeHistory } from "@/components/nodes/NodeHistory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NodeDetailPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = use(params);
  const router = useRouter();
  const { data: node, error } = useNode(nodeId);
  const { data: rels, mutate: mutateRels } = useNodeRelationships(nodeId);
  const { data: specs } = useNodeSpecs(nodeId);
  const { data: history } = useNodeHistory(nodeId);

  const handleDelete = async () => {
    if (!confirm("Delete this node? This action soft-deletes the node.")) return;
    const response = await fetch(`/api/nodes/${nodeId}`, { method: "DELETE" });
    if (response.ok) router.push("/graph");
  };

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Error loading node</p>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const nodeData = node as Record<string, unknown>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/graph">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1" />
        <Link href={`/graph/${nodeId}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </Link>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>

      <NodeDetail node={nodeData} />

      <NodeRelationships
        nodeId={nodeId}
        relationships={rels || []}
        onRefresh={() => mutateRels()}
      />

      {/* Attached specs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Attached Specs ({(specs || []).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(specs || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No attached specs</p>
          ) : (
            <div className="space-y-2">
              {(specs as Array<Record<string, unknown>>).map((spec) => (
                <Link
                  key={spec.id as string}
                  href={`/specs/${spec.id}`}
                  className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{spec.name as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {spec.spec_type as string} ({spec.format as string})
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {spec.relationship_type as string}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NodeHistory history={history || []} />
    </div>
  );
}
