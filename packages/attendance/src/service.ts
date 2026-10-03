import type { AttendanceRecord, AttendanceStatus } from "./model";
import type { ReplicationNode } from "../../sync/src/node";

export interface CreateAttendanceInput {
  schoolId: string;
  teacherUserId: string;
  deviceId: string;
  classId: string;
  studentId: string;
  sessionId: string;
  termId: string;
  date: string;
  status: AttendanceStatus;
}

export function recordAttendance(
  node: ReplicationNode<AttendanceRecord["payload"]>,
  input: CreateAttendanceInput,
): AttendanceRecord {
  const record: AttendanceRecord = {
    recordId: crypto.randomUUID(),
    schoolId: input.schoolId,
    userId: input.teacherUserId,
    deviceId: input.deviceId,
    recordType: "attendance",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    entityVersion: 1,
    sessionId: input.sessionId,
    termId: input.termId,
    classId: input.classId,
    studentId: input.studentId,
    visibility: "school_official",
    payload: {
      date: input.date,
      status: input.status,
    },
  };

  node.saveLocal(record);
  return record;
}
