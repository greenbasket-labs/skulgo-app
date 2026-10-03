import type { SchoolModuleManifest } from "./module-contract";
import { StaticModuleCatalog } from "./module-registry";
import { SCHOOL_MODULE } from "../../school/src/manifest";

export const SKULGO_MODULE_MANIFESTS: SchoolModuleManifest[] = [
  SCHOOL_MODULE,
  ADMISSION_STUDENT_MODULE,
];

export const SKULGO_MODULE_CATALOG = new StaticModuleCatalog(
  SKULGO_MODULE_MANIFESTS,
);
