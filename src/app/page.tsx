"use client";

import { useNodes, useValidation } from "@/lib/hooks/use-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";
import {
  Network,
  FileText,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";

const NODE_TYPES: NodeType[] = [
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

export default function DashboardPage() {
  const { data: nodesData } = useNodes();
  const { data: warnings } = useValidation();

  const nodes = nodesData?.nodes || [];
  const typeCounts: Record<string, number> = {};
  for (const node of nodes) {
    const n = node as Record<string, unknown>;
    const t = n.nodeType as string;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const warningList = Array.isArray(warnings) ? warnings : [];
  const errorCount = warningList.filter(
    (w: { severity: string }) => w.severity === "error"
  ).length;
  const warnCount = warningList.filter(
    (w: { severity: string }) => w.severity === "warning"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Enterprise architecture knowledge graph overview
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/graph">
            <Button variant="outline">
              <Network className="h-4 w-4 mr-2" />
              Open Graph
            </Button>
          </Link>
          <Link href="/graph?create=true">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Node
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{nodes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spec Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              <span className="text-3xl font-bold">
                {typeCounts["SpecDocument"] || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold">{warningList.length}</span>
              <div className="flex gap-1">
                {errorCount > 0 && (
                  <Badge variant="destructive">{errorCount} errors</Badge>
                )}
                {warnCount > 0 && (
                  <Badge variant="secondary">{warnCount} warnings</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Node Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {NODE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/graph?nodeType=${type}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
                  />
                  <span className="text-sm font-medium">{type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {typeCounts[type] || 0}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {warningList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Validation Issues</CardTitle>
            <Link href="/validation">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningList.slice(0, 5).map((w: { rule: string; severity: string; message: string; nodeId?: string }, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
                >
                  <Badge
                    variant={
                      w.severity === "error" ? "destructive" : "secondary"
                    }
                  >
                    {w.severity}
                  </Badge>
                  <span>{w.message}</span>
                  {w.nodeId && (
                    <Link
                      href={`/graph/${w.nodeId}`}
                      className="ml-auto text-xs text-blue-500 hover:underline"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
