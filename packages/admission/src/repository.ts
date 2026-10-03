import type { Admission, Student } from "./model";

export interface AdmissionStudentRepository {
  saveAdmission(admission: Admission): Promise<void>;
  getAdmission(admissionId: string): Promise<Admission | undefined>;
  saveStudent(student: Student): Promise<void>;
  getStudent(studentId: string): Promise<Student | undefined>;
}
