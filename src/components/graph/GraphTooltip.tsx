"use client";

import { Card } from "@/components/ui/card";
import { NODE_TYPE_COLORS, type NodeType } from "@/lib/types/graph";
import { getStatusColor } from "@/lib/graph/rendering-utils";

interface TooltipData {
  name: string;
  nodeType: NodeType;
  status: string;
  degree: number;
}

interface GraphTooltipProps {
  data: TooltipData | null;
  x: number;
  y: number;
}

export function GraphTooltip({ data, x, y }: GraphTooltipProps) {
  if (!data) return null;

  return (
    <Card
      className="absolute pointer-events-none z-50 px-3 py-2 shadow-lg border text-sm min-w-[160px]"
      style={{ left: x + 15, top: y + 15 }}
    >
      <div className="font-semibold text-foreground">{data.name}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: NODE_TYPE_COLORS[data.nodeType] }}
        />
        <span className="text-xs text-muted-foreground">{data.nodeType}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor(data.status) }}
          />
          <span className="text-xs text-muted-foreground capitalize">{data.status}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.degree} connection{data.degree !== 1 ? "s" : ""}
        </span>
      </div>
    </Card>
  );
}
