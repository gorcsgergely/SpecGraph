"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";

interface SearchResult {
  node: Record<string, unknown>;
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No results found</p>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result) => {
        const n = result.node;
        const nodeType = n.nodeType as NodeType;
        const color = NODE_TYPE_COLORS[nodeType] || "#6b7280";
        return (
          <Link
            key={n.id as string}
            href={`/graph/${n.id}`}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{String(n.name)}</p>
              {n.description ? (
                <p className="text-sm text-muted-foreground truncate">
                  {String(n.description)}
                </p>
              ) : null}
            </div>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {String(nodeType)}
            </Badge>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {String(n.status)}
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
