"use client";

import { useState } from "react";
import { ExportConfigurator } from "@/components/export/ExportConfigurator";
import { ExportPreview } from "@/components/export/ExportPreview";

interface ExportResult {
  markdown: string;
  nodeCount: number;
  relationshipCount: number;
}

export default function ExportPage() {
  const [result, setResult] = useState<ExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (config: {
    rootId: string;
    depth: number;
    validation: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        rootId: config.rootId,
        depth: String(config.depth),
        validation: String(config.validation),
      });
      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Export</h1>
        <p className="text-muted-foreground text-sm">
          Export a subgraph as markdown for AI coding agents
        </p>
      </div>

      <ExportConfigurator onExport={handleExport} />

      {loading && (
        <p className="text-center text-muted-foreground">Generating export...</p>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {result && (
        <ExportPreview
          markdown={result.markdown}
          nodeCount={result.nodeCount}
          relationshipCount={result.relationshipCount}
        />
      )}
    </div>
  );
}
