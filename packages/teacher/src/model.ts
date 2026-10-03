export type TeacherStatus = "ACTIVE" | "DISABLED";

export interface Teacher {
  teacherId: string;
  schoolId: string;
  fullName: string;
  employeeNumber?: string;
  phone?: string;
  email?: string;
  status: TeacherStatus;
  createdAt: string;
}
