import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const RESULTS_MODULE: SchoolModuleManifest = {
  moduleId: "results",
  version: "1.0.0",
  displayName: "Results",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "subject", contractVersion: "1.0.0", required: true },
    { moduleId: "ca", contractVersion: "1.0.0", required: true },
    { moduleId: "exam", contractVersion: "1.0.0", required: true },
  ],
};
