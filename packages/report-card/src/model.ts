import type { SchoolProfile } from "../../school/src/domain";
import type { AttendanceSummary } from "../../attendance/src/model";

export interface ReportCardSubject {
  subjectId: string;
  total?: number;
  grade?: string;
}

export interface ReportCard {
  reportCardId: string;
  school: Pick<SchoolProfile, "schoolId" | "name">;
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
  subjects: ReportCardSubject[];
  subjectsOffered: number;
  overallTotal?: number;
  average?: number;
  position?: number;
  attendance: AttendanceSummary;
}
