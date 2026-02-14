"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Star } from "lucide-react";
import type { NodeType } from "@/lib/types/graph";
import {
  getSuggestedTemplates,
  getAllTemplates,
  getTemplateContent,
  SPEC_TEMPLATES,
} from "@/lib/templates";

interface AttachSpecDialogProps {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  onCreated?: () => void;
}

export function AttachSpecDialog({
  nodeId,
  nodeType,
  nodeName,
  onCreated,
}: AttachSpecDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggested = getSuggestedTemplates(nodeType);
  const all = getAllTemplates();
  const suggestedTypes = new Set(suggested.map((s) => s.specType));
  const others = all.filter((t) => !suggestedTypes.has(t.specType));

  const handleSelect = async (specType: string) => {
    setLoading(specType);
    setError(null);

    try {
      const template = getTemplateContent(specType);
      const meta = SPEC_TEMPLATES[specType];

      const response = await fetch(`/api/nodes/${nodeId}/specs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${meta?.name || specType} - ${nodeName}`,
          spec_type: specType,
          format: meta?.suggestedFormat || "markdown",
          content: template || "",
          status: "draft",
          relationship_type: "SPECIFIED_BY",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create spec");
      }

      const spec = await response.json();
      setOpen(false);
      onCreated?.();
      router.push(`/specs/${spec.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Spec
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Specification</DialogTitle>
          <DialogDescription>
            Choose a template to create a new spec attached to{" "}
            <span className="font-medium text-foreground">{nodeName}</span>
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        ) : null}

        {suggested.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Star className="h-3 w-3" />
              Suggested for {nodeType}
            </div>
            {suggested.map((t) => (
              <button
                key={t.specType}
                onClick={() => handleSelect(t.specType)}
                disabled={loading !== null}
                className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-sm">{t.name}</span>
                  {loading === t.specType ? (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Creating...
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {t.specType}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {t.description}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          {suggested.length > 0 ? (
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              All Templates
            </div>
          ) : null}
          {others.map((t) => (
            <button
              key={t.specType}
              onClick={() => handleSelect(t.specType)}
              disabled={loading !== null}
              className="w-full text-left p-3 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm">{t.name}</span>
                {loading === t.specType ? (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Creating...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {t.specType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
