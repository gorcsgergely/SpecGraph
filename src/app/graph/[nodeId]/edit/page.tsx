"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useNode } from "@/lib/hooks/use-graph";
import { NodeForm } from "@/components/nodes/NodeForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NodeEditPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = use(params);
  const router = useRouter();
  const { data: node } = useNode(nodeId);

  if (!node) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/graph/${nodeId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          Edit: {(node as Record<string, unknown>).name as string}
        </h1>
      </div>

      <NodeForm
        initialData={node as Record<string, unknown>}
        nodeId={nodeId}
        onSuccess={() => router.push(`/graph/${nodeId}`)}
      />
    </div>
  );
}
