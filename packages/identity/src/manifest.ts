import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const IDENTITY_MODULE: SchoolModuleManifest = {
  moduleId: "identity",
  version: "1.0.0",
  displayName: "Identity & Roles",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
