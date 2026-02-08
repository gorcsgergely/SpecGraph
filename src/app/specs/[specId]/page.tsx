"use client";

import { use, useState, useCallback } from "react";
import { useNode } from "@/lib/hooks/use-graph";
import { SpecEditor } from "@/components/specs/SpecEditor";
import { SpecPreview } from "@/components/specs/SpecPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Columns, Code, Eye } from "lucide-react";

export default function SpecEditorPage({
  params,
}: {
  params: Promise<{ specId: string }>;
}) {
  const { specId } = use(params);
  const { data: spec, mutate } = useNode(specId);
  const [view, setView] = useState<"split" | "editor" | "preview">("split");
  const [liveContent, setLiveContent] = useState<string | null>(null);

  const handleSave = useCallback(
    async (content: string) => {
      await fetch(`/api/specs/${specId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setLiveContent(content);
      mutate();
    },
    [specId, mutate]
  );

  if (!spec) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const s = spec as Record<string, unknown>;
  const content = liveContent ?? (s.content as string) ?? "";
  const format = (s.format as string) || "markdown";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-3 border-b">
        <Link href={`/graph`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold">{s.name as string}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">
              {s.spec_type as string}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {format}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 border rounded-md">
          <Button
            variant={view === "editor" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("editor")}
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button
            variant={view === "split" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("split")}
          >
            <Columns className="h-3 w-3" />
          </Button>
          <Button
            variant={view === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("preview")}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        {(view === "split" || view === "editor") && (
          <div className={view === "split" ? "w-1/2 border-r" : "w-full"}>
            <SpecEditor
              specId={specId}
              content={content}
              format={format}
              onSave={handleSave}
            />
          </div>
        )}
        {(view === "split" || view === "preview") && (
          <div className={view === "split" ? "w-1/2" : "w-full"}>
            <SpecPreview content={content} format={format} />
          </div>
        )}
      </div>
    </div>
  );
}
