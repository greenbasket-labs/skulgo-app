import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const ATTENDANCE_MODULE: SchoolModuleManifest = {
  moduleId: "attendance",
  version: "1.0.0",
  displayName: "Attendance",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "subject", contractVersion: "1.0.0", required: true },
    { moduleId: "teacher", contractVersion: "1.0.0", required: true },
    { moduleId: "assignment", contractVersion: "1.0.0", required: true },
  ],
};
