import type { TeacherAssignment } from "../../identity/src/assignments";
import { teacherCanAccessAssignment } from "../../identity/src/assignments";
import type { ReplicationNode } from "../../sync/src/node";
import type { AttendanceRecord, AttendanceStatus } from "./model";
import { AttendanceRepository } from "./repository";

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

export async function recordAttendance(
  node: ReplicationNode<AttendanceRecord["payload"]>,
  repository: AttendanceRepository,
  input: CreateAttendanceInput,
): Promise<AttendanceRecord> {
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

  // Local domain persistence happens before synchronization.
  await repository.save(record);
  node.saveLocal(record);

  return record;
}
