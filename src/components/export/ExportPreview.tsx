"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ExportPreviewProps {
  markdown: string;
  nodeCount: number;
  relationshipCount: number;
}

export function ExportPreview({ markdown, nodeCount, relationshipCount }: ExportPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "specgraph-export.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Export Preview</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {nodeCount} nodes, {relationshipCount} relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-3 w-3 mr-1" />
            Download .md
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="text-xs font-mono bg-muted p-4 rounded-md overflow-auto max-h-[600px] whitespace-pre-wrap">
          {markdown}
        </pre>
      </CardContent>
    </Card>
  );
}
