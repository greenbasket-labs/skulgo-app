import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCARepository } from "../packages/ca/src/in-memory-repository";
import { InMemoryExamRepository } from "../packages/exam/src/in-memory-repository";
import { ResultsService } from "../packages/results/src/service";
import { TotalsService } from "../packages/totals/src/service";

const query = {
  schoolId: "school-1",
  studentId: "student-1",
  classId: "class-1",
  subjectId: "subject-1",
  sessionId: "session-1",
  termId: "term-1",
};

test("totals combines available CA and exam scores", async () => {
  const ca = new InMemoryCARepository();
  const exam = new InMemoryExamRepository();

  await ca.saveRecord({
    caId: "ca-1", schoolId: "school-1", studentId: "student-1", classId: "class-1",
    subjectId: "subject-1", teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    assessmentName: "CA 1", maximumScore: 20, score: 15, date: "2026-10-01",
    createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
  });
  await ca.saveRecord({
    caId: "ca-2", schoolId: "school-1", studentId: "student-1", classId: "class-1",
    subjectId: "subject-1", teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    assessmentName: "CA 2", maximumScore: 20, score: 18, date: "2026-10-15",
    createdAt: "2026-10-15T00:00:00.000Z", updatedAt: "2026-10-15T00:00:00.000Z",
  });
  await exam.saveExam({
    examId: "exam-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
    teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    name: "First Term Examination", maximumScore: 100, date: "2026-12-10",
    createdAt: "2026-10-01T00:00:00.000Z",
  });
  await exam.saveScore({
    examScoreId: "score-1", examId: "exam-1", schoolId: "school-1", studentId: "student-1",
    classId: "class-1", subjectId: "subject-1", teacherId: "teacher-1",
    sessionId: "session-1", termId: "term-1", score: 65, date: "2026-12-10",
    createdAt: "2026-12-10T00:00:00.000Z", updatedAt: "2026-12-10T00:00:00.000Z",
  });

  const totals = await new TotalsService(new ResultsService(ca, exam)).getTotal(query, { canView: true });

  assert.equal(totals.caTotal, 33);
  assert.equal(totals.examScore, 65);
  assert.equal(totals.combinedTotal, 98);
});

test("totals allows CA without an exam", async () => {
  const ca = new InMemoryCARepository();
  const exam = new InMemoryExamRepository();

  await ca.saveRecord({
    caId: "ca-1", schoolId: "school-1", studentId: "student-1", classId: "class-1",
    subjectId: "subject-1", teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    assessmentName: "CA 1", maximumScore: 20, score: 17, date: "2026-10-01",
    createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
  });

  const totals = await new TotalsService(new ResultsService(ca, exam)).getTotal(query, { canView: true });

  assert.equal(totals.caTotal, 17);
  assert.equal(totals.examScore, undefined);
  assert.equal(totals.combinedTotal, 17);
});

test("totals allows an exam without CA", async () => {
  const ca = new InMemoryCARepository();
  const exam = new InMemoryExamRepository();

  await exam.saveExam({
    examId: "exam-1", schoolId: "school-1", classId: "class-1", subjectId: "subject-1",
    teacherId: "teacher-1", sessionId: "session-1", termId: "term-1",
    name: "First Term Examination", maximumScore: 100, date: "2026-12-10",
    createdAt: "2026-10-01T00:00:00.000Z",
  });
  await exam.saveScore({
    examScoreId: "score-1", examId: "exam-1", schoolId: "school-1", studentId: "student-1",
    classId: "class-1", subjectId: "subject-1", teacherId: "teacher-1",
    sessionId: "session-1", termId: "term-1", score: 70, date: "2026-12-10",
    createdAt: "2026-12-10T00:00:00.000Z", updatedAt: "2026-12-10T00:00:00.000Z",
  });

  const totals = await new TotalsService(new ResultsService(ca, exam)).getTotal(query, { canView: true });

  assert.equal(totals.caTotal, undefined);
  assert.equal(totals.examScore, 70);
  assert.equal(totals.combinedTotal, 70);
});

test("totals leaves total empty when neither component exists", async () => {
  const totals = await new TotalsService(
    new ResultsService(new InMemoryCARepository(), new InMemoryExamRepository()),
  ).getTotal(query, { canView: true });

  assert.equal(totals.caTotal, undefined);
  assert.equal(totals.examScore, undefined);
  assert.equal(totals.combinedTotal, undefined);
});
