import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const REPORT_CARD_MODULE: SchoolModuleManifest = {
  moduleId: "report-card",
  version: "1.0.0",
  displayName: "Report Card",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "grade", contractVersion: "1.0.0", required: true },
    { moduleId: "aggregate", contractVersion: "1.0.0", required: true },
    { moduleId: "rank", contractVersion: "1.0.0", required: true },
    { moduleId: "attendance", contractVersion: "1.0.0", required: true },
  ],
};
