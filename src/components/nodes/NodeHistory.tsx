"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NodeHistoryProps {
  history: Array<Record<string, unknown>>;
}

export function NodeHistory({ history }: NodeHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version History ({history.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No version history</p>
        ) : (
          <div className="space-y-3">
            {history.map((version, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-md border"
              >
                <Badge variant={version.valid_to ? "secondary" : "default"}>
                  v{version.version as number}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{version.name as string}</p>
                  <p className="text-xs text-muted-foreground">
                    {version.valid_from as string}
                    {version.valid_to ? ` — ${version.valid_to as string}` : " (current)"}
                  </p>
                </div>
                <Badge variant="outline">{version.status as string}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
