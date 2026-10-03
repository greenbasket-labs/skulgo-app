export type AdmissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Admission {
  admissionId: string;
  schoolId: string;
  applicantName: string;
  intendedClassId?: string;
  admissionNumber?: string;
  status: AdmissionStatus;
  studentId?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  studentId: string;
  schoolId: string;
  admissionId: string;
  name: string;
  classId?: string;
  admissionNumber?: string;
  createdAt: string;
}
