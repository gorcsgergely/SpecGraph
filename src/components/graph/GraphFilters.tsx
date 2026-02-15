"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { NODE_TYPE_COLORS, type NodeType, type NodeLayer, type RelationshipType } from "@/lib/types/graph";
import { X } from "lucide-react";

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

const LAYERS: NodeLayer[] = ["business", "application", "spec"];
const STATUSES = ["draft", "active", "deprecated", "archived"];

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "COMPOSES",
  "REALIZES",
  "SERVES",
  "ACCESSES",
  "FLOWS_TO",
  "TRIGGERS",
  "DEPENDS_ON",
  "SPECIFIED_BY",
  "TESTED_BY",
  "IMPLEMENTED_BY",
];

interface GraphFiltersProps {
  filters: {
    nodeType?: string;
    layer?: string;
    status?: string;
  };
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  visibleRelTypes?: Set<string>;
  onRelTypeToggle?: (relType: string) => void;
}

export function GraphFilters({
  filters,
  onFilterChange,
  visibleRelTypes,
  onRelTypeToggle,
}: GraphFiltersProps) {
  const hasFilters = filters.nodeType || filters.layer || filters.status;

  return (
    <div className="p-4 space-y-4 border-r w-56 bg-muted/20 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onFilterChange({ nodeType: undefined, layer: undefined, status: undefined })
            }
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Layer</Label>
        <Select
          value={filters.layer || "all"}
          onValueChange={(v) =>
            onFilterChange({ ...filters, layer: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Layers</SelectItem>
            {LAYERS.map((l) => (
              <SelectItem key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Node Type</Label>
        <Select
          value={filters.nodeType || "all"}
          onValueChange={(v) =>
            onFilterChange({ ...filters, nodeType: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {NODE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: NODE_TYPE_COLORS[t] }}
                  />
                  {t}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) =>
            onFilterChange({ ...filters, status: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visibleRelTypes && onRelTypeToggle ? (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs">Relationships</Label>
          <div className="space-y-1.5">
            {RELATIONSHIP_TYPES.map((rt) => (
              <div key={rt} className="flex items-center gap-2">
                <Checkbox
                  id={`rel-${rt}`}
                  checked={visibleRelTypes.has(rt)}
                  onCheckedChange={() => onRelTypeToggle(rt)}
                  className="h-3.5 w-3.5"
                />
                <label
                  htmlFor={`rel-${rt}`}
                  className="text-[10px] text-muted-foreground cursor-pointer leading-none"
                >
                  {rt}
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="pt-2 border-t">
        <Label className="text-xs text-muted-foreground">Legend</Label>
        <div className="mt-2 space-y-1">
          {NODE_TYPES.map((t) => (
            <div key={t} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: NODE_TYPE_COLORS[t] }}
              />
              <span className="text-[10px] text-muted-foreground truncate">
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
