import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const ASSIGNMENT_MODULE: SchoolModuleManifest = {
  moduleId: "assignment",
  version: "1.0.0",
  displayName: "Teacher Assignment",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "teacher", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "subject", contractVersion: "1.0.0", required: true },
  ],
};
