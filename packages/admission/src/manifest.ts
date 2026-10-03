import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const ADMISSION_MODULE: SchoolModuleManifest = {
  moduleId: "admission",
  version: "1.0.0",
  displayName: "Admission",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "student", contractVersion: "1.0.0", required: true },
  ],
};
