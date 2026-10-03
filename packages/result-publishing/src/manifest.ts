import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const RESULT_PUBLISHING_MODULE: SchoolModuleManifest = {
  moduleId: "result-publishing",
  version: "1.0.0",
  displayName: "Result Publishing",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "identity", contractVersion: "1.0.0", required: true },
    { moduleId: "results", contractVersion: "1.0.0", required: true },
    { moduleId: "report-card", contractVersion: "1.0.0", required: true },
  ],
};
