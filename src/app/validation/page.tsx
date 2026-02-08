"use client";

import { useValidation } from "@/lib/hooks/use-graph";
import { ValidationDashboard } from "@/components/validation/ValidationDashboard";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ValidationPage() {
  const { data, isLoading, mutate } = useValidation();

  const warnings = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Validation</h1>
          <p className="text-muted-foreground text-sm">
            Advisory validation rules for graph quality
          </p>
        </div>
        <Button variant="outline" onClick={() => mutate()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Re-run
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">
          Running validation rules...
        </p>
      ) : (
        <ValidationDashboard warnings={warnings} />
      )}
    </div>
  );
}
