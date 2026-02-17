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
import { NODE_TYPE_COLORS, type NodeType, type RelationshipType } from "@/lib/types/graph";
import { X } from "lucide-react";

const STATUSES = ["draft", "active", "deprecated", "archived"];

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "COMPOSES",
  "REALIZES",
  "SERVES",
  "ACCESSES",
  "FLOWS_TO",
  "TRIGGERS",
  "DEPENDS_ON",
  "ASSOCIATED_WITH",
  "SPECIFIED_BY",
  "TESTED_BY",
  "IMPLEMENTED_BY",
];

const NODE_TYPE_GROUPS: { layer: string; label: string; types: NodeType[] }[] = [
  {
    layer: "business",
    label: "Business",
    types: [
      "BusinessCapability",
      "BusinessService",
      "BusinessProcess",
      "ProcessStep",
      "DataEntity",
      "GlossaryTerm",
    ],
  },
  {
    layer: "application",
    label: "Application",
    types: ["Application", "ApplicationComponent", "API"],
  },
  {
    layer: "data",
    label: "Data",
    types: ["DataStore", "DataObject", "DataField"],
  },
  {
    layer: "spec",
    label: "Spec",
    types: ["SpecDocument"],
  },
];

interface GraphFiltersProps {
  filters: {
    status?: string;
  };
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  visibleRelTypes?: Set<string>;
  onRelTypeToggle?: (relType: string) => void;
  visibleNodeTypes: Set<string>;
  onNodeTypeToggle: (type: string) => void;
  onLayerToggle: (layer: string, types: string[]) => void;
}

export function GraphFilters({
  filters,
  onFilterChange,
  visibleRelTypes,
  onRelTypeToggle,
  visibleNodeTypes,
  onNodeTypeToggle,
  onLayerToggle,
}: GraphFiltersProps) {
  const hasFilters = filters.status;

  return (
    <div className="p-4 space-y-4 border-r w-56 bg-muted/20 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({ status: undefined })}
          >
            <X className="h-3 w-3" />
          </Button>
        ) : null}
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

      <div className="space-y-2 pt-2 border-t">
        <Label className="text-xs">Node Types</Label>
        <div className="space-y-3">
          {NODE_TYPE_GROUPS.map((group) => {
            const allChecked = group.types.every((t) => visibleNodeTypes.has(t));
            const someChecked = group.types.some((t) => visibleNodeTypes.has(t));

            return (
              <div key={group.layer} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`layer-${group.layer}`}
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={() =>
                      onLayerToggle(group.layer, group.types)
                    }
                    className="h-3.5 w-3.5"
                  />
                  <label
                    htmlFor={`layer-${group.layer}`}
                    className="text-xs font-medium cursor-pointer leading-none"
                  >
                    {group.label}
                  </label>
                </div>
                <div className="ml-5 space-y-1">
                  {group.types.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <Checkbox
                        id={`type-${t}`}
                        checked={visibleNodeTypes.has(t)}
                        onCheckedChange={() => onNodeTypeToggle(t)}
                        className="h-3 w-3"
                      />
                      <label
                        htmlFor={`type-${t}`}
                        className="text-[10px] text-muted-foreground cursor-pointer leading-none flex-1"
                      >
                        {t}
                      </label>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: NODE_TYPE_COLORS[t] }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
