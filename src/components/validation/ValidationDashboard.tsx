"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Warning {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
}

interface ValidationDashboardProps {
  warnings: Warning[];
}

const SEVERITY_ICON = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLOR = {
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

export function ValidationDashboard({ warnings }: ValidationDashboardProps) {
  const grouped: Record<string, Warning[]> = {};
  for (const w of warnings) {
    if (!grouped[w.rule]) grouped[w.rule] = [];
    grouped[w.rule].push(w);
  }

  const errorCount = warnings.filter((w) => w.severity === "error").length;
  const warnCount = warnings.filter((w) => w.severity === "warning").length;
  const infoCount = warnings.filter((w) => w.severity === "info").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{errorCount}</span>
              <span className="text-sm text-muted-foreground">Errors</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{warnCount}</span>
              <span className="text-sm text-muted-foreground">Warnings</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{infoCount}</span>
              <span className="text-sm text-muted-foreground">Info</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(grouped).map(([rule, items]) => {
        const severity = items[0].severity;
        const Icon = SEVERITY_ICON[severity];
        return (
          <Card key={rule}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className={`h-4 w-4 ${SEVERITY_COLOR[severity]}`} />
                {rule.replace(/_/g, " ")}
                <Badge variant="secondary">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {item.nodeName || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.nodeType || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.message}</TableCell>
                      <TableCell>
                        {item.nodeId && (
                          <Link
                            href={`/graph/${item.nodeId}`}
                            className="text-xs text-blue-500 hover:underline"
                          >
                            View
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {warnings.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              No validation issues found. All clear!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
