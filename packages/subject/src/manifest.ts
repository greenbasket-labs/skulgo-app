import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const SUBJECT_MODULE: SchoolModuleManifest = {
  moduleId: "subject",
  version: "1.0.0",
  displayName: "Subject",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
