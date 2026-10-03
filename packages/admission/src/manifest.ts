import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const ADMISSION_STUDENT_MODULE: SchoolModuleManifest = {
  moduleId: "admission-student",
  version: "1.0.0",
  displayName: "Admission / Student",
  status: "available",
  dependencies: [{ moduleId: "school", contractVersion: "1.0.0", required: true }],
};
