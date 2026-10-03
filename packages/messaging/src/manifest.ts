import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const MESSAGING_MODULE: SchoolModuleManifest = {
  moduleId: "messaging",
  version: "1.0.0",
  displayName: "Messaging",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
