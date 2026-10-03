import type { SchoolModuleManifest } from "./module-contract";
import { StaticModuleCatalog } from "./module-registry";
import { SCHOOL_MODULE } from "../../school/src/manifest";
import { ADMISSION_STUDENT_MODULE } from "../../admission/src/manifest";
import { CLASS_MODULE } from "../../class/src/manifest";
import { SUBJECT_MODULE } from "../../subject/src/manifest";
import { TEACHER_MODULE } from "../../teacher/src/manifest";
import { ASSIGNMENT_MODULE } from "../../assignment/src/manifest";
import { ATTENDANCE_MODULE } from "../../attendance/src/manifest";
import { CA_MODULE } from "../../ca/src/manifest";
import { EXAM_MODULE } from "../../exam/src/manifest";
import { RESULTS_MODULE } from "../../results/src/manifest";
import { TOTALS_MODULE } from "../../totals/src/manifest";
import { GRADE_MODULE } from "../../grade/src/manifest";
import { AGGREGATE_MODULE } from "../../aggregate/src/manifest";
import { RANK_MODULE } from "../../rank/src/manifest";

export const SKULGO_MODULE_MANIFESTS: SchoolModuleManifest[] = [
  SCHOOL_MODULE,
  ADMISSION_STUDENT_MODULE,
  CLASS_MODULE,
  SUBJECT_MODULE,
  TEACHER_MODULE,
  ASSIGNMENT_MODULE,
  ATTENDANCE_MODULE,
  CA_MODULE,
  EXAM_MODULE,
  RESULTS_MODULE,
  TOTALS_MODULE,
  GRADE_MODULE,
  AGGREGATE_MODULE,
  RANK_MODULE,
];

export const SKULGO_MODULE_CATALOG = new StaticModuleCatalog(
  SKULGO_MODULE_MANIFESTS,
);
