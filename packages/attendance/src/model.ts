import type { SchoolRecord } from "../../school-records/src/record";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendancePayload {
  date: string;
  status: AttendanceStatus;
}

export type AttendanceRecord = SchoolRecord<AttendancePayload>;

export function isAttendanceForStudent(
  record: AttendanceRecord,
  studentId: string,
): boolean {
  return record.studentId === studentId;
}
