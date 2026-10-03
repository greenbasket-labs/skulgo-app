import type { SchoolModuleManifest } from "../../shared/src/module-contract";

export const RANK_MODULE: SchoolModuleManifest = {
  moduleId: "rank",
  version: "1.0.0",
  displayName: "Rank",
  status: "available",
  dependencies: [
    { moduleId: "school", contractVersion: "1.0.0", required: true },
    { moduleId: "admission-student", contractVersion: "1.0.0", required: true },
    { moduleId: "class", contractVersion: "1.0.0", required: true },
    { moduleId: "aggregate", contractVersion: "1.0.0", required: true },
  ],
};
