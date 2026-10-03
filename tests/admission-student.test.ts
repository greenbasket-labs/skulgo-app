import assert from "node:assert/strict";
import test from "node:test";
import { AdmissionStudentService } from "../packages/admission/src/service";
import type { Admission, Student } from "../packages/admission/src/model";
import type { AdmissionStudentRepository } from "../packages/admission/src/repository";

class MemoryRepository implements AdmissionStudentRepository {
  admissions = new Map<string, Admission>();
  students = new Map<string, Student>();

  async saveAdmission(item: Admission) { this.admissions.set(item.admissionId, item); }
  async getAdmission(id: string) { return this.admissions.get(id); }
  async saveStudent(item: Student) { this.students.set(item.studentId, item); }
  async getStudent(id: string) { return this.students.get(id); }
}

test("approved admission automatically creates a student", async () => {
  const repository = new MemoryRepository();
  const service = new AdmissionStudentService(repository);
  await service.submit({
    admissionId: "adm-1",
    schoolId: "school-1",
    applicantName: "Musa Abdullahi",
    intendedClassId: "ss-1",
    status: "PENDING",
    createdByUserId: "staff-1",
    createdAt: "2026-10-03T08:00:00.000Z",
    updatedAt: "2026-10-03T08:00:00.000Z",
  }, { canSubmit: true, canApprove: false });

  const result = await service.approve(
    "adm-1",
    "admin-1",
    { canSubmit: false, canApprove: true },
    "2026-10-03T08:05:00.000Z",
    () => "ABR/SS/2026/6548",
  );

  assert.equal(result.admission.status, "APPROVED");
  assert.equal(result.student.studentId, "ABR/SS/2026/6548");
  assert.equal(result.admission.studentId, result.student.studentId);
});

test("a permitted staff member can approve directly", async () => {
  const repository = new MemoryRepository();
  const service = new AdmissionStudentService(repository);
  await service.submit({
    admissionId: "adm-2",
    schoolId: "school-1",
    applicantName: "Aisha Bello",
    status: "PENDING",
    createdByUserId: "staff-1",
    createdAt: "2026-10-03T08:00:00.000Z",
    updatedAt: "2026-10-03T08:00:00.000Z",
  }, { canSubmit: true, canApprove: false });

  const result = await service.approve(
    "adm-2",
    "staff-1",
    { canSubmit: true, canApprove: true },
    "2026-10-03T08:06:00.000Z",
    () => "ABR/SS/2026/6549",
  );

  assert.equal(result.student.studentId, "ABR/SS/2026/6549");
});
