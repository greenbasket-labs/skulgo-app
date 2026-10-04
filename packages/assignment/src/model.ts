export type AssignmentStatus = "ACTIVE" | "DISABLED";
export type AssignmentType = "CLASS_MASTER" | "SUBJECT_TEACHER";

export interface TeachingAssignment {
  assignmentId: string;
  schoolId: string;
  teacherId: string;
  classId: string;
  assignmentType: AssignmentType;
  subjectId?: string;
  status: AssignmentStatus;
  createdAt: string;
}
