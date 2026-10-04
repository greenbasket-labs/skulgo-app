import type { LocalTeacherAssignment } from "./repository";

export function canCreateTeacherAssignment(existing: LocalTeacherAssignment[], next: LocalTeacherAssignment): boolean {
  return !existing.some((item) => {
    if (item.schoolId !== next.schoolId || item.status !== "ACTIVE" || next.status !== "ACTIVE") return false;
    if (item.assignmentType !== next.assignmentType || item.classId !== next.classId) return false;
    return next.assignmentType === "CLASS_MASTER" || item.subjectId === next.subjectId;
  });
}

export function teacherCanAccessAssignment(assignment: LocalTeacherAssignment, teacherUserId: string): boolean {
  return assignment.teacherUserId === teacherUserId && assignment.status === "ACTIVE";
}
