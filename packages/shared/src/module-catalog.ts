import type { SchoolModuleManifest } from "./module-contract";
import { StaticModuleCatalog } from "./module-registry";
import { IDENTITY_MODULE } from "../../identity/src/manifest";
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
import { REPORT_CARD_MODULE } from "../../report-card/src/manifest";
import { FEES_MODULE } from "../../fees/src/manifest";
import { CASHIER_MODULE } from "../../cashier/src/manifest";
import { MESSAGING_MODULE } from "../../messaging/src/manifest";
import { SYNC_MODULE } from "../../sync/src/manifest";
import { BACKUP_MODULE } from "../../backup/src/manifest";
import { PAIRING_MODULE } from "../../pairing/src/manifest";
import { CONNECTION_MODULE } from "../../connection/src/manifest";
import { RESULT_PUBLISHING_MODULE } from "../../result-publishing/src/manifest";

export const SKULGO_MODULE_MANIFESTS: SchoolModuleManifest[] = [
  SCHOOL_MODULE, IDENTITY_MODULE, ADMISSION_STUDENT_MODULE, CLASS_MODULE, SUBJECT_MODULE, TEACHER_MODULE,
  ASSIGNMENT_MODULE, ATTENDANCE_MODULE, CA_MODULE, EXAM_MODULE, RESULTS_MODULE,
  TOTALS_MODULE, GRADE_MODULE, AGGREGATE_MODULE, RANK_MODULE, REPORT_CARD_MODULE,
  FEES_MODULE, CASHIER_MODULE, MESSAGING_MODULE, SYNC_MODULE, BACKUP_MODULE, PAIRING_MODULE,
  CONNECTION_MODULE, RESULT_PUBLISHING_MODULE,
];

export const SKULGO_MODULE_CATALOG = new StaticModuleCatalog(SKULGO_MODULE_MANIFESTS);
