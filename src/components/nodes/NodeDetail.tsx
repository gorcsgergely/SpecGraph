"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";

interface NodeDetailProps {
  node: Record<string, unknown>;
}

const SKIP_KEYS = new Set([
  "id", "nodeType", "layer", "valid_from", "valid_to",
  "version", "created_by", "updated_at",
]);

export function NodeDetail({ node }: NodeDetailProps) {
  const nodeType = node.nodeType as NodeType;
  const color = NODE_TYPE_COLORS[nodeType] || "#6b7280";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1">
            <CardTitle>{String(node.name)}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{String(nodeType)}</Badge>
              <Badge variant="secondary">{String(node.status)}</Badge>
              <Badge variant="outline">v{String(node.version)}</Badge>
              <span className="text-xs text-muted-foreground">
                {String(node.layer)} layer
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {node.description ? (
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">
              {String(node.description)}
            </p>
          </div>
        ) : null}

        {Array.isArray(node.tags) && (node.tags as string[]).length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-1">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {(node.tags as string[]).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(node)
            .filter(
              ([key, value]) =>
                !SKIP_KEYS.has(key) &&
                key !== "name" &&
                key !== "description" &&
                key !== "status" &&
                key !== "tags" &&
                value !== "" &&
                value !== null &&
                value !== undefined &&
                !(Array.isArray(value) && value.length === 0)
            )
            .map(([key, value]) => (
              <div key={key} className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground">
                  {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </h4>
                <p className="text-sm">
                  {typeof value === "boolean"
                    ? (value ? "Yes" : "No")
                    : Array.isArray(value)
                    ? (value as string[]).join(", ")
                    : String(value)}
                </p>
              </div>
            ))}
        </div>

        <div className="pt-3 border-t text-xs text-muted-foreground space-y-1">
          <p>ID: {String(node.id)}</p>
          <p>Created by: {String(node.created_by)}</p>
          <p>Updated: {String(node.updated_at)}</p>
          <p>Valid from: {String(node.valid_from)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
