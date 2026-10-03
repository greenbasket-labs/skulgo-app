import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCARepository } from "../packages/ca/src/in-memory-repository";
import { CAService } from "../packages/ca/src/service";
import type { AssignmentRepository } from "../packages/assignment/src/repository";
import type { TeachingAssignment } from "../packages/assignment/src/model";
import type { AdmissionStudentRepository } from "../packages/admission/src/repository";
import type { Student } from "../packages/admission/src/model";
import type { SchoolContract } from "../packages/school/src/contract";

const assignment: TeachingAssignment = {
  assignmentId: "assign-1",
  schoolId: "school-1",
  teacherId: "teacher-1",
  classId: "class-1",
  subjectId: "subject-1",
  status: "ACTIVE",
  createdAt: "2026-10-03T08:00:00.000Z",
};

const student: Student = {
  studentId: "student-1",
  schoolId: "school-1",
  admissionId: "adm-1",
  name: "Musa",
  classId: "class-1",
  createdAt: "2026-10-03T08:00:00.000Z",
};

function service() {
  const assignments = new Map([[assignment.assignmentId, assignment]]);
  const assignmentRepository: AssignmentRepository = {
    save: async (item) => assignments.set(item.assignmentId, item),
    get: async () => assignment,
    list: async () => [assignment],
  };
  const students = new Map([[student.studentId, student]]);
  const admissionRepository: AdmissionStudentRepository = {
    saveAdmission: async () => {},
    getAdmission: async () => undefined,
    saveStudent: async (item) => students.set(item.studentId, item),
    getStudent: async (id) => students.get(id),
  };
  const schoolContract: SchoolContract = {
    getSchool: async () => undefined,
    getCurrentSession: async () => ({ sessionId: "session-1", schoolId: "school-1", name: "2026/2027", status: "ACTIVE", startDate: "2026-09-01", endDate: "2027-07-31" }),
    getCurrentTerm: async () => ({ termId: "term-1", sessionId: "session-1", name: "First Term", status: "ACTIVE", startDate: "2026-09-01", endDate: "2026-12-20" }),
    getAcademicSessions: async () => [],
  };
  return new CAService(new InMemoryCARepository(), assignmentRepository, admissionRepository, schoolContract);
}

test("teacher can create an assessment and save a valid score", async () => {
  const s = service();
  const assessment = await s.createAssessment({
    assessmentId: "ca-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
    teacherId: "teacher-1", sessionId: "session-1", termId: "term-1", name: "CA 1",
    maximumScore: 20, date: "2026-10-03", createdAt: "2026-10-03T08:00:00.000Z",
  }, { canManage: true, canView: true });

  const record = await s.saveScore({
    caId: "record-1", schoolId: "school-1", studentId: "student-1", classId: "class-1",
    subjectId: "subject-1", teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    assessmentName: assessment.assessmentId, maximumScore: 20, score: 15, date: "2026-10-03",
    createdAt: "2026-10-03T08:00:00.000Z", updatedAt: "2026-10-03T08:00:00.000Z",
  }, { canManage: true, canView: true });

  assert.equal(record.score, 15);
  assert.equal(record.maximumScore, 20);
});

test("CA rejects scores above the assessment maximum", async () => {
  const s = service();
  await s.createAssessment({
    assessmentId: "ca-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
    teacherId: "teacher-1", sessionId: "session-1", termId: "term-1", name: "CA 1",
    maximumScore: 20, date: "2026-10-03", createdAt: "2026-10-03T08:00:00.000Z",
  }, { canManage: true, canView: true });

  await assert.rejects(() => s.saveScore({
    caId: "record-1", schoolId: "school-1", studentId: "student-1", classId: "class-1",
    subjectId: "subject-1", teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    assessmentName: "ca-1", maximumScore: 20, score: 21, date: "2026-10-03",
    createdAt: "2026-10-03T08:00:00.000Z", updatedAt: "2026-10-03T08:00:00.000Z",
  }, { canManage: true, canView: true }), /Score must be between 0 and the assessment maximum/);
});

test("CA requires permission to manage", async () => {
  const s = service();
  await assert.rejects(() => s.createAssessment({
    assessmentId: "ca-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
    teacherId: "teacher-1", sessionId: "session-1", termId: "term-1", name: "CA 1",
    maximumScore: 20, date: "2026-10-03", createdAt: "2026-10-03T08:00:00.000Z",
  }, { canManage: false, canView: false }), /CA management not permitted/);
});
