import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const CONNECTION_MODULE: SchoolModuleManifest = {
  moduleId: "connection",
  version: "1.1.0",
  displayName: "Local Network Connection",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "identity", contractVersion: "1.0.0", required: true },
    { moduleId: "sync", contractVersion: "1.0.0", required: true },
    { moduleId: "pairing", contractVersion: "1.0.0", required: true },
  ],
};
