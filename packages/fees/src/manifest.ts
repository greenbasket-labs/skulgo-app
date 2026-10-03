import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const FEES_MODULE: SchoolModuleManifest = {
  moduleId: "fees",
  version: "1.0.0",
  displayName: "Fees",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
  ],
};
