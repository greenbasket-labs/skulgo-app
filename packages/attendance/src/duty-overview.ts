import type { LocalTeacherAssignment } from "../../identity/src/repository";
import type { AttendancePeriod } from "./summary";
import type { AttendanceSummary } from "./model";

export interface AttendanceDutyOverview {
  assignmentId: string;
  assignedUserId: string;
  classId: string;
  subjectId: string;
  period: AttendancePeriod;
  summary: AttendanceSummary;
}

export function createAttendanceDutyOverview(
  assignment: LocalTeacherAssignment,
  period: AttendancePeriod,
  summary: AttendanceSummary,
  viewer: { userId: string; canViewAll: boolean },
): AttendanceDutyOverview {
  if (!viewer.canViewAll && viewer.userId !== assignment.teacherUserId) {
    throw new Error("Attendance duty overview not permitted");
  }

  return {
    assignmentId: assignment.assignmentId,
    assignedUserId: assignment.teacherUserId,
    classId: assignment.classId,
    subjectId: assignment.subjectId,
    period,
    summary,
  };
}
