import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryExamRepository } from "../packages/exam/src/in-memory-repository";
import { ExamService } from "../packages/exam/src/service";
import type { AssignmentRepository } from "../packages/assignment/src/repository";
import type { TeachingAssignment } from "../packages/assignment/src/model";
import type { AdmissionStudentRepository } from "../packages/admission/src/repository";
import type { Student } from "../packages/admission/src/model";
import type { SchoolContract } from "../packages/school/src/contract";

const assignment: TeachingAssignment = {
  assignmentId: "assign-1", schoolId: "school-1", teacherId: "teacher-1",
  classId: "class-1", assignmentType: "SUBJECT_TEACHER", subjectId: "subject-1", status: "ACTIVE",
  createdAt: "2026-10-03T08:00:00.000Z",
};
const student: Student = {
  studentId: "student-1", schoolId: "school-1", admissionId: "adm-1",
  name: "Musa", classId: "class-1", createdAt: "2026-10-03T08:00:00.000Z",
};

function service() {
  const assignmentRepository: AssignmentRepository = {
    save: async () => {}, get: async () => assignment, list: async () => [assignment],
  };
  const admissionRepository: AdmissionStudentRepository = {
    saveAdmission: async () => {}, getAdmission: async () => undefined,
    saveStudent: async () => {}, getStudent: async (id) => id === student.studentId ? student : undefined,
  };
  const schoolContract: SchoolContract = {
    getSchool: async () => undefined,
    getCurrentSession: async () => ({ sessionId: "session-1", schoolId: "school-1", name: "2026/2027", createdAt: "2026-09-01T00:00:00.000Z", isCurrent: true }),
    getCurrentTerm: async () => ({ termId: "term-1", schoolId: "school-1", sessionId: "session-1", name: "First Term", createdAt: "2026-09-01T00:00:00.000Z", isCurrent: true }),
    getAcademicSessions: async () => [],
  };
  return new ExamService(new InMemoryExamRepository(), assignmentRepository, admissionRepository, schoolContract);
}

const baseExam = {
  examId: "exam-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
  teacherId: "teacher-1", sessionId: "session-1", termId: "term-1", name: "First Term Examination",
  maximumScore: 100, date: "2026-12-10", createdAt: "2026-10-03T08:00:00.000Z",
};

test("teacher can create an exam and save a valid score", async () => {
  const s = service();
  const exam = await s.createExam(baseExam, { canManage: true, canView: true });
  const score = await s.saveScore({
    examScoreId: "score-1", examId: exam.examId, schoolId: "school-1", studentId: "student-1",
    classId: "class-1", subjectId: "subject-1", teacherId: "teacher-1",
    sessionId: "session-1", termId: "term-1", score: 72, date: exam.date,
    createdAt: "2026-12-10T08:00:00.000Z", updatedAt: "2026-12-10T08:00:00.000Z",
  }, { canManage: true, canView: true });
  assert.equal(score.score, 72);
});

test("exam rejects scores above maximum", async () => {
  const s = service();
  await s.createExam(baseExam, { canManage: true, canView: true });
  await assert.rejects(() => s.saveScore({
    examScoreId: "score-1", examId: "exam-1", schoolId: "school-1", studentId: "student-1",
    classId: "class-1", subjectId: "subject-1", teacherId: "teacher-1",
    sessionId: "session-1", termId: "term-1", score: 101, date: baseExam.date,
    createdAt: "2026-12-10T08:00:00.000Z", updatedAt: "2026-12-10T08:00:00.000Z",
  }, { canManage: true, canView: true }), /Score must be between 0 and the exam maximum/);
});

test("exam management requires permission", async () => {
  const s = service();
  await assert.rejects(() => s.createExam(baseExam, { canManage: false, canView: false }), /Exam management not permitted/);
});

test("exam rejects a student outside the assigned class", async () => {
  const s = service();
  await s.createExam(baseExam, { canManage: true, canView: true });
  await assert.rejects(() => s.saveScore({
    examScoreId: "score-1", examId: "exam-1", schoolId: "school-1", studentId: "missing",
    classId: "class-1", subjectId: "subject-1", teacherId: "teacher-1",
    sessionId: "session-1", termId: "term-1", score: 50, date: baseExam.date,
    createdAt: "2026-12-10T08:00:00.000Z", updatedAt: "2026-12-10T08:00:00.000Z",
  }, { canManage: true, canView: true }), /Student not found/);
});
