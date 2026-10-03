import type { AttendanceRecord, AttendanceStudent, AttendanceSummary } from "./model";

export type AttendancePeriod = "daily" | "weekly" | "monthly" | "termly" | "yearly";

export function summarizeAttendance(
  records: AttendanceRecord[],
  students: AttendanceStudent[],
): AttendanceSummary {
  const studentsById = new Map(students.map((student) => [student.studentId, student]));
  const studentIds = new Set<string>();

  let male = 0;
  let female = 0;
  let present = 0;
  let absent = 0;

  for (const record of records) {
    if (!record.studentId) continue;
    studentIds.add(record.studentId);

    const student = studentsById.get(record.studentId);
    if (student?.gender === "M") male += 1;
    if (student?.gender === "F") female += 1;
    if (record.payload.status === "present") present += 1;
    if (record.payload.status === "absent") absent += 1;
  }

  return { total: studentIds.size, male, female, present, absent };
}
