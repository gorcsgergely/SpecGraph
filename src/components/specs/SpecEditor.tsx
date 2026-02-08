"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading editor...</div>,
});

interface SpecEditorProps {
  specId: string;
  content: string;
  format: string;
  onSave: (content: string) => Promise<void>;
}

const FORMAT_LANGUAGE: Record<string, string> = {
  markdown: "markdown",
  yaml: "yaml",
  json: "json",
  mermaid: "markdown",
};

export function SpecEditor({ specId, content, format, onSave }: SpecEditorProps) {
  const [value, setValue] = useState(content);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = useCallback((val: string | undefined) => {
    setValue(val || "");
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <span className="text-sm text-muted-foreground flex-1">
          {format.toUpperCase()} editor
          {dirty && <span className="text-amber-500 ml-2">(unsaved)</span>}
        </span>
        <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
          <Save className="h-3 w-3 mr-1" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={FORMAT_LANGUAGE[format] || "plaintext"}
          value={value}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            lineNumbers: "on",
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}
