import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const BACKUP_MODULE: SchoolModuleManifest = {
  moduleId: "backup",
  version: "1.0.0",
  displayName: "Backup",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
