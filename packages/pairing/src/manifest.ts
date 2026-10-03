import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const PAIRING_MODULE: SchoolModuleManifest = {
  moduleId: "pairing",
  version: "1.0.0",
  displayName: "Device Pairing",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "identity", contractVersion: "1.0.0", required: true },
    { moduleId: "sync", contractVersion: "1.0.0", required: true },
  ],
};
