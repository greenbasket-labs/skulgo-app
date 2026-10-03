import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const EXAM_MODULE: SchoolModuleManifest = {
  moduleId: "exam",
  version: "1.0.0",
  displayName: "Examination",
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
