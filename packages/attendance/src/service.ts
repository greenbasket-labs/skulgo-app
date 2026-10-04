import type { IdentityRepository } from "../../identity/src/sqlite-repository";
import type { ReplicationNode } from "../../sync/src/node";
import type { AttendanceRecord, AttendanceStatus } from "./model";
import { AttendanceRepository } from "./repository";

export interface CreateAttendanceInput {
  schoolId:string; teacherUserId:string; deviceId:string; classId:string; studentId:string;
  sessionId:string; termId:string; date:string; status:AttendanceStatus;
}

export async function recordAttendance(node:ReplicationNode<AttendanceRecord["payload"]>, attendanceRepository:AttendanceRepository, identityRepository:IdentityRepository, input:CreateAttendanceInput):Promise<AttendanceRecord> {
  const assignment = await identityRepository.findClassMasterAssignment(input.schoolId,input.teacherUserId,input.classId);
  if (!assignment) throw new Error("Teacher is not assigned as Class Master for this class");
  const students = await identityRepository.listStudents(input.schoolId,input.classId);
  if (!students.some((student)=>student.studentId===input.studentId)) throw new Error("Student does not belong to this class");
  const now=new Date().toISOString();
  const record:AttendanceRecord={
    recordId:crypto.randomUUID(), schoolId:input.schoolId, userId:input.teacherUserId, deviceId:input.deviceId,
    recordType:"attendance", createdAt:now, updatedAt:now, entityVersion:1, sessionId:input.sessionId,
    termId:input.termId, classId:input.classId, studentId:input.studentId, visibility:"school_official",
    payload:{date:input.date,status:input.status},
  };
  await attendanceRepository.save(record); node.saveLocal(record); return record;
}
