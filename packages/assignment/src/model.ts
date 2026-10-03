export type AssignmentStatus = "ACTIVE" | "DISABLED";

export interface TeachingAssignment {
  assignmentId: string;
  schoolId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  status: AssignmentStatus;
  createdAt: string;
}
