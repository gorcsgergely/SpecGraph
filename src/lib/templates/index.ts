import type { NodeType } from "@/lib/types/graph";

import { metadata as complianceSecurityMeta, content as complianceSecurityContent } from "./compliance-security";
import { metadata as architectureMeta, content as architectureContent } from "./architecture";
import { metadata as dataModelMeta, content as dataModelContent } from "./data-model";
import { metadata as stateManagementMeta, content as stateManagementContent } from "./state-management";
import { metadata as workflowMeta, content as workflowContent } from "./workflow";
import { metadata as apiInternalMeta, content as apiInternalContent } from "./api-internal";
import { metadata as apiExternalMeta, content as apiExternalContent } from "./api-external";
import { metadata as uiSpecMeta, content as uiSpecContent } from "./ui-spec";
import { metadata as businessRulesMeta, content as businessRulesContent } from "./business-rules";
import { metadata as businessRequirementsMeta, content as businessRequirementsContent } from "./business-requirements";
import { metadata as deploymentMeta, content as deploymentContent } from "./deployment";
import { metadata as openapiMeta, content as openapiContent } from "./openapi";
import { metadata as sequenceMeta, content as sequenceContent } from "./sequence";
import { metadata as implementationSpecMeta, content as implementationSpecContent } from "./implementation-spec";
import { metadata as testSpecMeta, content as testSpecContent } from "./test-spec";

export interface TemplateInfo {
  name: string;
  description: string;
  suggestedFormat: "markdown" | "yaml" | "json" | "mermaid";
  content: string;
}

export const SPEC_TEMPLATES: Record<string, TemplateInfo> = {
  compliance_security: { ...complianceSecurityMeta, content: complianceSecurityContent },
  architecture: { ...architectureMeta, content: architectureContent },
  data_model: { ...dataModelMeta, content: dataModelContent },
  state_management: { ...stateManagementMeta, content: stateManagementContent },
  workflow: { ...workflowMeta, content: workflowContent },
  api_internal: { ...apiInternalMeta, content: apiInternalContent },
  api_external: { ...apiExternalMeta, content: apiExternalContent },
  ui_spec: { ...uiSpecMeta, content: uiSpecContent },
  business_rules: { ...businessRulesMeta, content: businessRulesContent },
  business_requirements: { ...businessRequirementsMeta, content: businessRequirementsContent },
  deployment: { ...deploymentMeta, content: deploymentContent },
  openapi: { ...openapiMeta, content: openapiContent },
  sequence: { ...sequenceMeta, content: sequenceContent },
  implementation_spec: { ...implementationSpecMeta, content: implementationSpecContent },
  test_spec: { ...testSpecMeta, content: testSpecContent },
};

export function getTemplateContent(specType: string): string | null {
  return SPEC_TEMPLATES[specType]?.content ?? null;
}

export type TemplateSuggestion = {
  specType: string;
  name: string;
  description: string;
};

const TEMPLATE_SUGGESTIONS: Partial<Record<NodeType, string[]>> = {
  BusinessCapability: ["business_requirements", "compliance_security", "business_rules"],
  BusinessService: ["business_requirements", "workflow", "compliance_security"],
  BusinessProcess: ["workflow", "state_management", "business_rules", "test_spec"],
  ProcessStep: ["workflow", "ui_spec", "business_rules"],
  DataEntity: ["data_model", "compliance_security", "implementation_spec"],
  Application: ["architecture", "deployment", "compliance_security", "test_spec"],
  ApplicationComponent: ["architecture", "api_internal", "implementation_spec", "test_spec"],
  API: ["api_internal", "api_external", "openapi", "test_spec"],
  GlossaryTerm: ["data_model", "business_rules", "compliance_security"],
  DataStore: ["architecture", "deployment", "compliance_security"],
  DataObject: ["data_model", "implementation_spec", "test_spec"],
  DataField: ["data_model", "compliance_security"],
};

export function getSuggestedTemplates(nodeType: NodeType): TemplateSuggestion[] {
  const specTypes = TEMPLATE_SUGGESTIONS[nodeType] || [];
  return specTypes
    .filter((st) => SPEC_TEMPLATES[st])
    .map((st) => ({
      specType: st,
      name: SPEC_TEMPLATES[st].name,
      description: SPEC_TEMPLATES[st].description,
    }));
}

export function getAllTemplates(): TemplateSuggestion[] {
  return Object.entries(SPEC_TEMPLATES).map(([specType, info]) => ({
    specType,
    name: info.name,
    description: info.description,
  }));
}
