export interface TeacherAssignment {
  assignmentId: string;
  schoolId: string;
  teacherUserId: string;
  classId: string;
  subjectId: string;
  createdAt: string;
}

/**
 * Initial SkulGo rule:
 * one teacher may be assigned to a class + subject combination.
 */
export function canCreateTeacherAssignment(
  existing: TeacherAssignment[],
  next: TeacherAssignment,
): boolean {
  return !existing.some(
    (item) =>
      item.schoolId === next.schoolId &&
      item.classId === next.classId &&
      item.subjectId === next.subjectId,
  );
}

export function teacherCanAccessAssignment(
  assignment: TeacherAssignment,
  teacherUserId: string,
): boolean {
  return assignment.teacherUserId === teacherUserId;
}
