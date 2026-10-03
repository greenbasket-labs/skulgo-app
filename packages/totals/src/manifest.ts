import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const TOTALS_MODULE: SchoolModuleManifest = {
  moduleId: "totals",
  version: "1.0.0",
  displayName: "Totals",
  status: "available",
  dependencies: [
    { moduleId: "results", contractVersion: "1.0.0", required: true },
  ],
};
