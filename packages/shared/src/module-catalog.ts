import type { SchoolModuleManifest } from "./module-contract";
import { StaticModuleCatalog } from "./module-registry";
import { SCHOOL_MODULE } from "../../school/src/manifest";
import { ADMISSION_STUDENT_MODULE } from "../../admission/src/manifest";
import { CLASS_MODULE } from "../../class/src/manifest";

export const SKULGO_MODULE_MANIFESTS: SchoolModuleManifest[] = [
  SCHOOL_MODULE,
  ADMISSION_STUDENT_MODULE,
  CLASS_MODULE,
  ADMISSION_STUDENT_MODULE,
];

export const SKULGO_MODULE_CATALOG = new StaticModuleCatalog(
  SKULGO_MODULE_MANIFESTS,
);
