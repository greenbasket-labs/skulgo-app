import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const CASHIER_MODULE: SchoolModuleManifest = {
  moduleId: "cashier",
  version: "1.0.0",
  displayName: "Cashier",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "fees", contractVersion: "1.0.0", required: true },
  ],
};
