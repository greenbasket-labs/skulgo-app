import type { AttendanceRecord } from "../../attendance/src/model";
import type { SubjectResultRecord } from "../../results/src/model";

export interface ReportCardStudent {
  studentId: string;
  classId: string;
  sessionId: string;
  termId: string;
}

export interface ReportCardSubject {
  subjectId: string;
  result?: SubjectResultRecord;
}

export interface ReportCard {
  student: ReportCardStudent;
  subjects: ReportCardSubject[];
  attendance: AttendanceRecord[];
}

/**
 * Report cards consume existing official records.
 * They do not ask teachers/admins to re-enter CA or exam data.
 */
export function buildReportCard(
  student: ReportCardStudent,
  results: SubjectResultRecord[],
  attendance: AttendanceRecord[],
): ReportCard {
  const subjects = results
    .filter(
      (result) =>
        result.studentId === student.studentId &&
        result.classId === student.classId &&
        result.sessionId === student.sessionId &&
        result.termId === student.termId,
    )
    .map((result) => ({
      subjectId: result.subjectId!,
      result,
    }));

  return {
    student,
    subjects,
    attendance: attendance.filter(
      (item) =>
        item.studentId === student.studentId &&
        item.classId === student.classId &&
        item.sessionId === student.sessionId &&
        item.termId === student.termId,
    ),
  };
}
