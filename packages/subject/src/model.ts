export type SubjectStatus = "ACTIVE" | "DISABLED";

export interface Subject {
  subjectId: string;
  schoolId: string;
  name: string;
  status: SubjectStatus;
  createdAt: string;
}
