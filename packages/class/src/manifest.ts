import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const CLASS_MODULE: SchoolModuleManifest = {
  moduleId: "class",
  version: "1.0.0",
  displayName: "Class",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
  ],
};
