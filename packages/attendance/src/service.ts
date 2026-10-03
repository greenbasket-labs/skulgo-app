import type { TeacherAssignment } from "../../identity/src/assignments";
import { teacherCanAccessAssignment } from "../../identity/src/assignments";
import type { AttendanceRecord, AttendanceStatus } from "./model";
import type { ReplicationNode } from "../../sync/src/node";

export interface CreateAttendanceInput {
  schoolId: string;
  teacherUserId: string;
  deviceId: string;
  assignment: TeacherAssignment;
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
  if (input.assignment.schoolId !== input.schoolId) {
    throw new Error("Teacher assignment belongs to another school");
  }

  if (input.assignment.classId !== input.classId) {
    throw new Error("Teacher is not assigned to this class");
  }

  if (!teacherCanAccessAssignment(input.assignment, input.teacherUserId)) {
    throw new Error("Teacher is not authorized for this assignment");
  }

  const now = new Date().toISOString();

  const record: AttendanceRecord = {
    recordId: crypto.randomUUID(),
    schoolId: input.schoolId,
    userId: input.teacherUserId,
    deviceId: input.deviceId,
    recordType: "attendance",
    createdAt: now,
    updatedAt: now,
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
