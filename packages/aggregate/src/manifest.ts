import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const AGGREGATE_MODULE: SchoolModuleManifest = {
  moduleId: "aggregate",
  version: "1.0.0",
  displayName: "Aggregate",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "subject", contractVersion: "1.0.0", required: true },
    { moduleId: "totals", contractVersion: "1.0.0", required: true },
  ],
};
