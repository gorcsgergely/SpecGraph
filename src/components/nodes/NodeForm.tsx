"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { NodeType } from "@/lib/types/graph";
import { getTemplateContent, SPEC_TEMPLATES } from "@/lib/templates";

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

// Type-specific fields
const TYPE_FIELDS: Record<string, Array<{ name: string; type: "text" | "textarea" | "number" | "select" | "tags" | "boolean"; label: string; options?: string[] }>> = {
  BusinessCapability: [
    { name: "level", type: "number", label: "Level (1-3)" },
    { name: "domain", type: "text", label: "Domain" },
    { name: "owner", type: "text", label: "Owner" },
    { name: "acceptance_criteria", type: "textarea", label: "Acceptance Criteria" },
    { name: "business_rules", type: "textarea", label: "Business Rules" },
  ],
  BusinessService: [
    { name: "service_type", type: "text", label: "Service Type" },
    { name: "sla_target", type: "text", label: "SLA Target" },
    { name: "acceptance_criteria", type: "textarea", label: "Acceptance Criteria" },
    { name: "service_contract", type: "textarea", label: "Service Contract" },
    { name: "non_functional_reqs", type: "textarea", label: "Non-Functional Requirements" },
  ],
  BusinessProcess: [
    { name: "process_type", type: "text", label: "Process Type" },
    { name: "trigger", type: "text", label: "Trigger" },
    { name: "outcome", type: "text", label: "Outcome" },
    { name: "estimated_duration", type: "text", label: "Estimated Duration" },
    { name: "acceptance_criteria", type: "textarea", label: "Acceptance Criteria" },
    { name: "preconditions", type: "textarea", label: "Preconditions" },
    { name: "postconditions", type: "textarea", label: "Postconditions" },
    { name: "error_scenarios", type: "textarea", label: "Error Scenarios" },
  ],
  ProcessStep: [
    { name: "sequence_order", type: "number", label: "Sequence Order" },
    { name: "step_type", type: "select", label: "Step Type", options: ["manual", "automated", "decision"] },
    { name: "actor", type: "text", label: "Actor" },
    { name: "input_spec", type: "textarea", label: "Input Spec" },
    { name: "output_spec", type: "textarea", label: "Output Spec" },
    { name: "validation_rules", type: "textarea", label: "Validation Rules" },
    { name: "code_hints", type: "textarea", label: "Code Hints" },
  ],
  DataEntity: [
    { name: "entity_type", type: "select", label: "Entity Type", options: ["master", "transactional", "reference"] },
    { name: "sensitivity", type: "text", label: "Sensitivity" },
    { name: "pii", type: "boolean", label: "Contains PII" },
    { name: "retention_policy", type: "text", label: "Retention Policy" },
    { name: "schema_summary", type: "textarea", label: "Schema Summary" },
    { name: "validation_rules", type: "textarea", label: "Validation Rules" },
    { name: "code_hints", type: "textarea", label: "Code Hints" },
  ],
  Application: [
    { name: "app_type", type: "select", label: "App Type", options: ["custom", "cots", "saas", "legacy"] },
    { name: "deployment", type: "text", label: "Deployment" },
    { name: "repo_url", type: "text", label: "Repository URL" },
    { name: "architecture_notes", type: "textarea", label: "Architecture Notes" },
    { name: "code_hints", type: "textarea", label: "Code Hints" },
    { name: "non_functional_reqs", type: "textarea", label: "Non-Functional Requirements" },
  ],
  ApplicationComponent: [
    { name: "component_type", type: "text", label: "Component Type" },
    { name: "language", type: "text", label: "Language" },
    { name: "package_path", type: "text", label: "Package Path" },
    { name: "repo_path", type: "text", label: "Repo Path" },
    { name: "interface_spec", type: "textarea", label: "Interface Spec" },
    { name: "code_hints", type: "textarea", label: "Code Hints" },
    { name: "dependencies_notes", type: "textarea", label: "Dependencies Notes" },
    { name: "acceptance_criteria", type: "textarea", label: "Acceptance Criteria" },
  ],
  API: [
    { name: "api_type", type: "select", label: "API Type", options: ["rest", "graphql", "grpc", "event"] },
    { name: "method", type: "select", label: "Method", options: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
    { name: "path", type: "text", label: "Path" },
    { name: "auth_type", type: "text", label: "Auth Type" },
    { name: "rate_limit", type: "text", label: "Rate Limit" },
    { name: "request_schema", type: "textarea", label: "Request Schema" },
    { name: "response_schema", type: "textarea", label: "Response Schema" },
    { name: "error_codes", type: "textarea", label: "Error Codes" },
    { name: "code_hints", type: "textarea", label: "Code Hints" },
    { name: "example_request", type: "textarea", label: "Example Request" },
    { name: "example_response", type: "textarea", label: "Example Response" },
  ],
  SpecDocument: [
    { name: "spec_type", type: "select", label: "Spec Type", options: ["openapi", "erd", "sequence", "test_spec", "design_doc", "implementation_spec", "compliance_security", "architecture", "data_model", "state_management", "workflow", "api_internal", "api_external", "ui_spec", "business_rules", "deployment"] },
    { name: "format", type: "select", label: "Format", options: ["markdown", "yaml", "json", "mermaid"] },
    { name: "content", type: "textarea", label: "Content" },
  ],
};

const LAYER_MAP: Record<string, string> = {
  BusinessCapability: "business",
  BusinessService: "business",
  BusinessProcess: "business",
  ProcessStep: "business",
  DataEntity: "business",
  Application: "application",
  ApplicationComponent: "application",
  API: "application",
  SpecDocument: "spec",
};

interface NodeFormProps {
  initialData?: Record<string, unknown>;
  nodeId?: string;
  onSuccess?: () => void;
}

export function NodeForm({ initialData, nodeId, onSuccess }: NodeFormProps) {
  const [nodeType, setNodeType] = useState<string>(
    (initialData?.nodeType as string) || "BusinessCapability"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: (initialData as Record<string, string | number | boolean>) || {},
  });

  const isCreate = !nodeId;
  const specType = watch("spec_type") as string | undefined;
  const hasAutoFilled = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isCreate || !specType || nodeType !== "SpecDocument") return;
    if (hasAutoFilled.current.has(specType)) return;

    const template = getTemplateContent(specType);
    if (template) {
      const currentContent = watch("content") as string | undefined;
      if (!currentContent) {
        setValue("content", template);
        const meta = SPEC_TEMPLATES[specType];
        if (meta?.suggestedFormat) {
          setValue("format", meta.suggestedFormat);
        }
        hasAutoFilled.current.add(specType);
      }
    }
  }, [specType, isCreate, nodeType, setValue, watch]);

  const fields = TYPE_FIELDS[nodeType] || [];

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...data,
        nodeType,
        layer: LAYER_MAP[nodeType],
        tags: typeof data.tags === "string"
          ? (data.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : data.tags || [],
        tech_stack: typeof data.tech_stack === "string"
          ? (data.tech_stack as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : data.tech_stack || undefined,
        channel: typeof data.channel === "string"
          ? (data.channel as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : data.channel || undefined,
      };

      const url = nodeId ? `/api/nodes/${nodeId}` : "/api/nodes";
      const method = nodeId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to save node");
      }

      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {!nodeId && (
        <div className="space-y-2">
          <Label>Node Type</Label>
          <Select value={nodeType} onValueChange={setNodeType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NODE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register("name")} required />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea {...register("description")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          defaultValue={(initialData?.status as string) || "draft"}
          onValueChange={(v) => setValue("status", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input {...register("tags")} placeholder="tag1, tag2" />
      </div>

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          {field.type === "text" && <Input {...register(field.name)} />}
          {field.type === "number" && (
            <Input type="number" {...register(field.name, { valueAsNumber: true })} />
          )}
          {field.type === "textarea" && (
            <Textarea {...register(field.name)} rows={3} />
          )}
          {field.type === "select" && (
            <Select
              defaultValue={(initialData?.[field.name] as string) || ""}
              onValueChange={(v) => setValue(field.name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field.type === "boolean" && (
            <div className="flex items-center gap-2">
              <Switch
                defaultChecked={!!initialData?.[field.name]}
                onCheckedChange={(v) => setValue(field.name, v)}
              />
            </div>
          )}
        </div>
      ))}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Saving..." : nodeId ? "Update Node" : "Create Node"}
      </Button>
    </form>
  );
}
