"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExportConfiguratorProps {
  onExport: (config: { rootId: string; depth: number; validation: boolean }) => void;
}

export function ExportConfigurator({ onExport }: ExportConfiguratorProps) {
  const [rootId, setRootId] = useState("");
  const [depth, setDepth] = useState(3);
  const [validation, setValidation] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Export Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Root Node ID</Label>
          <Input
            value={rootId}
            onChange={(e) => setRootId(e.target.value)}
            placeholder="Paste the root node ID"
          />
        </div>
        <div className="space-y-2">
          <Label>Traversal Depth: {depth}</Label>
          <Slider
            value={[depth]}
            onValueChange={(v) => setDepth(v[0])}
            min={1}
            max={5}
            step={1}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={validation} onCheckedChange={setValidation} />
          <Label>Include validation warnings</Label>
        </div>
        <Button
          className="w-full"
          disabled={!rootId}
          onClick={() => onExport({ rootId, depth, validation })}
        >
          Generate Export
        </Button>
      </CardContent>
    </Card>
  );
}
