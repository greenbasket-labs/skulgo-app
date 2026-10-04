import type { LocalTeacherAssignment } from "../../identity/src/repository";
import type { AttendancePeriod } from "./summary";
import type { AttendanceSummary } from "./model";

export interface AttendanceDutyOverview {
  assignmentId: string;
  assignedUserId: string;
  classId: string;
  period: AttendancePeriod;
  summary: AttendanceSummary;
}

export function createAttendanceDutyOverview(
  assignment: LocalTeacherAssignment,
  period: AttendancePeriod,
  summary: AttendanceSummary,
  viewer: { userId: string; canViewAll: boolean },
): AttendanceDutyOverview {
  if (assignment.assignmentType !== "CLASS_MASTER") {
    throw new Error("Attendance duty requires a Class Master assignment");
  }

  if (assignment.status !== "ACTIVE") {
    throw new Error("Attendance duty assignment is not active");
  }

  if (!viewer.canViewAll && viewer.userId !== assignment.teacherUserId) {
    throw new Error("Attendance duty overview not permitted");
  }

  return {
    assignmentId: assignment.assignmentId,
    assignedUserId: assignment.teacherUserId,
    classId: assignment.classId,
    period,
    summary,
  };
}
