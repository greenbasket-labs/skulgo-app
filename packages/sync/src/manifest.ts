import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const SYNC_MODULE: SchoolModuleManifest = {
  moduleId: "sync",
  version: "1.0.0",
  displayName: "Sync",
  status: "available",
  dependencies: [{ moduleId: "school", contractVersion: "1.0.0", required: true }],
};
