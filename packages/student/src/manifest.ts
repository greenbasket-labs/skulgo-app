import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const STUDENT_MODULE: SchoolModuleManifest = {
  moduleId: "student",
  version: "1.0.0",
  displayName: "Student",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
  ],
};
