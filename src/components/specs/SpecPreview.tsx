"use client";

import { useEffect, useRef } from "react";

interface SpecPreviewProps {
  content: string;
  format: string;
}

export function SpecPreview({ content, format }: SpecPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (format !== "mermaid" || !containerRef.current || !content.trim()) return;

    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "dark" });
        if (cancelled) return;
        const { svg } = await mermaid.render(
          `mermaid-${Date.now()}`,
          content
        );
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-red-400 text-sm p-4">${(err as Error).message}</pre>`;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content, format]);

  if (format === "mermaid") {
    return (
      <div className="h-full overflow-auto p-4 bg-zinc-900">
        <div ref={containerRef} className="flex justify-center" />
      </div>
    );
  }

  if (format === "json") {
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      return (
        <div className="h-full overflow-auto p-4 bg-zinc-900">
          <pre className="text-sm text-zinc-300 font-mono">{formatted}</pre>
        </div>
      );
    } catch {
      // Fall through to plain text
    }
  }

  return (
    <div className="h-full overflow-auto p-4 bg-zinc-900">
      <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
