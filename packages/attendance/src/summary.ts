import type { AttendanceRecord, AttendanceStudent, AttendanceSummary } from "./model";

export type AttendancePeriod = "daily" | "weekly" | "monthly" | "termly" | "yearly";

export function summarizeAttendance(
  records: AttendanceRecord[],
  students: AttendanceStudent[],
): AttendanceSummary {
  let male = 0;
  let female = 0;
  let present = 0;
  let absent = 0;

  for (const student of students) {
    if (student.gender === "M") male += 1;
    if (student.gender === "F") female += 1;
  }

  for (const record of records) {
    if (record.payload.status === "present") present += 1;
    if (record.payload.status === "absent") absent += 1;
  }

  return {
    total: students.length,
    male,
    female,
    present,
    absent,
  };
}

export function filterAttendanceByPeriod(
  records: AttendanceRecord[],
  period: AttendancePeriod,
  anchorDate: string,
  termRange?: { start: string; end: string },
): AttendanceRecord[] {
  const anchor = new Date(anchorDate);
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();

  let start: Date;
  let end: Date;

  if (period === "daily") {
    start = new Date(Date.UTC(year, month, day));
    end = new Date(Date.UTC(year, month, day + 1));
  } else if (period === "weekly") {
    const dayOfWeek = anchor.getUTCDay();
    start = new Date(Date.UTC(year, month, day - dayOfWeek));
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
  } else if (period === "monthly") {
    start = new Date(Date.UTC(year, month, 1));
    end = new Date(Date.UTC(year, month + 1, 1));
  } else if (period === "yearly") {
    start = new Date(Date.UTC(year, 0, 1));
    end = new Date(Date.UTC(year + 1, 0, 1));
  } else {
    if (!termRange) throw new Error("Term range is required for termly attendance");
    start = new Date(termRange.start);
    end = new Date(termRange.end);
  }

  return records.filter((record) => {
    const date = new Date(record.payload.date);
    return date >= start && date < end;
  });
}
