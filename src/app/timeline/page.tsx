"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TimelinePage() {
  const [dateStr, setDateStr] = useState(new Date().toISOString().slice(0, 16));
  const asOf = new Date(dateStr).toISOString();

  const { data } = useSWR(
    `/api/graph/temporal?asOf=${encodeURIComponent(asOf)}`,
    fetcher
  );

  const nodes = data?.nodes || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground text-sm">
          View the graph as it existed at a point in time
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time Travel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {nodes.length} nodes as of {new Date(asOf).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nodes ({nodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {nodes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No nodes existed at this time
            </p>
          ) : (
            <div className="space-y-2">
              {nodes.map((node: Record<string, unknown>) => (
                <Link
                  key={node.id as string}
                  href={`/graph/${node.id}`}
                  className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        NODE_TYPE_COLORS[node.nodeType as NodeType] || "#6b7280",
                    }}
                  />
                  <span className="text-sm font-medium flex-1">
                    {node.name as string}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {node.nodeType as string}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    v{node.version as number}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
