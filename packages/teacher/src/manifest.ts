import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const TEACHER_MODULE: SchoolModuleManifest = {
  moduleId: "teacher",
  version: "1.0.0",
  displayName: "Teacher",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
