import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const CA_MODULE: SchoolModuleManifest = {
  moduleId: "ca",
  version: "1.0.0",
  displayName: "Continuous Assessment",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "subject", contractVersion: "1.0.0", required: true },
    { moduleId: "teacher", contractVersion: "1.0.0", required: true },
    { moduleId: "assignment", contractVersion: "1.0.0", required: true },
  ],
};
