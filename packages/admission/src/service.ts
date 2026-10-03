import type { Admission, Student } from "./model";
import type { AdmissionStudentRepository } from "./repository";

export interface AdmissionPermission {
  canSubmit: boolean;
  canApprove: boolean;
}

export class AdmissionStudentService {
  constructor(private readonly repository: AdmissionStudentRepository) {}

  async submit(
    admission: Admission,
    permission: AdmissionPermission,
  ): Promise<Admission> {
    if (!permission.canSubmit) throw new Error("Admission submission not permitted");
    await this.repository.saveAdmission(admission);
    return admission;
  }

  async approve(
    admissionId: string,
    approvedByUserId: string,
    permission: AdmissionPermission,
    now: string,
    createStudentId: (admission: Admission) => string,
  ): Promise<{ admission: Admission; student: Student }> {
    if (!permission.canApprove) throw new Error("Admission approval not permitted");

    const admission = await this.repository.getAdmission(admissionId);
    if (!admission) throw new Error("Admission not found");
    if (admission.status !== "PENDING") throw new Error("Admission is not pending");

    const student: Student = {
      studentId: createStudentId(admission),
      schoolId: admission.schoolId,
      admissionId: admission.admissionId,
      name: admission.applicantName,
      classId: admission.intendedClassId,
      admissionNumber: admission.admissionNumber,
      gender: admission.gender,
      createdAt: now,
    };

    const approved: Admission = {
      ...admission,
      status: "APPROVED",
      studentId: student.studentId,
      updatedAt: now,
    };

    await this.repository.saveStudent(student);
    await this.repository.saveAdmission(approved);

    return { admission: approved, student };
  }
}
