import type { SchoolRecord } from "../../school-records/src/record";

export type AttendanceStatus = "present" | "absent";

export interface AttendancePayload {
  date: string;
  status: AttendanceStatus;
}

export type AttendanceRecord = SchoolRecord<AttendancePayload>;

export interface AttendanceStudent {
  studentId: string;
  gender?: "M" | "F";
}

export interface AttendanceSummary {
  total: number;
  male: number;
  female: number;
  present: number;
  absent: number;
}

export function isAttendanceForStudent(
  record: AttendanceRecord,
  studentId: string,
): boolean {
  return record.studentId === studentId;
}
