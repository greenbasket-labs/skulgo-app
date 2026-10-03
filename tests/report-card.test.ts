import assert from "node:assert/strict";
import test from "node:test";
import { CAInMemoryRepository } from "../packages/ca/src/in-memory-repository";
import { ExamInMemoryRepository } from "../packages/exam/src/in-memory-repository";
import { ResultsService } from "../packages/results/src/service";
import { TotalsService } from "../packages/totals/src/service";
import { GradeService } from "../packages/grade/src/service";
import { ReportCardService } from "../packages/report-card/src/service";
import type { AggregateResult } from "../packages/aggregate/src/model";

const queryBase = {
  schoolId: "school-1",
  studentId: "student-1",
  classId: "class-1",
  sessionId: "session-1",
  termId: "term-1",
};

test("report card assembles subject grades, aggregate summary, rank and attendance", async () => {
  const ca = new CAInMemoryRepository();
  const exam = new ExamInMemoryRepository();
  const results = new ResultsService(ca, exam);
  const totals = new TotalsService(results);
  const grades = new GradeService(totals);
  const service = new ReportCardService(grades);

  const examId = "exam-1";
  await exam.saveExam({
    examId,
    schoolId: "school-1",
    classId: "class-1",
    subjectId: "math",
    teacherId: "teacher-1",
    sessionId: "session-1",
    termId: "term-1",
    name: "First Term Examination",
    maximumScore: 100,
    date: "2026-12-10",
    createdAt: "2026-12-01T00:00:00.000Z",
  });
  await exam.saveScore({
    examScoreId: "score-1",
    examId,
    schoolId: "school-1",
    studentId: "student-1",
    classId: "class-1",
    subjectId: "math",
    teacherId: "teacher-1",
    sessionId: "session-1",
    termId: "term-1",
    score: 80,
    date: "2026-12-10",
    createdAt: "2026-12-10T00:00:00.000Z",
    updatedAt: "2026-12-10T00:00:00.000Z",
  });

  const aggregate: AggregateResult = {
    aggregateId: "aggregate-1",
    ...queryBase,
    subjectsOffered: 2,
    subjectsWithTotal: 1,
    subjectsMissingTotal: 1,
    overallTotal: 80,
    average: 40,
    subjectTotals: [
      { subjectId: "math", total: 80 },
      { subjectId: "english" },
    ],
  };

  const report = await service.getReportCard({
    school: { schoolId: "school-1", name: "Green Basket Global Limited" },
    ...queryBase,
    subjectIds: ["math", "english"],
    gradeScale: {
      schoolId: "school-1",
      bands: [
        { gradeId: "a", schoolId: "school-1", label: "A", minimumTotal: 70, maximumTotal: 100 },
        { gradeId: "b", schoolId: "school-1", label: "B", minimumTotal: 60, maximumTotal: 69 },
      ],
    },
    aggregate,
    rankEntry: {
      studentId: "student-1",
      subjectsOffered: 2,
      overallTotal: 80,
      average: 40,
      position: 3,
    },
    attendance: { total: 20, male: 1, female: 1, present: 18, absent: 2 },
  }, { canView: true });

  assert.deepEqual(report.subjects, [
    { subjectId: "math", total: 80, grade: "A" },
    { subjectId: "english" },
  ]);
  assert.equal(report.subjectsOffered, 2);
  assert.equal(report.overallTotal, 80);
  assert.equal(report.average, 40);
  assert.equal(report.position, 3);
  assert.deepEqual(report.attendance, { total: 20, male: 1, female: 1, present: 18, absent: 2 });
});

test("report card keeps a subject visible when it has no CA or exam total", async () => {
  const results = new ResultsService(new CAInMemoryRepository(), new ExamInMemoryRepository());
  const grades = new GradeService(new TotalsService(results));
  const service = new ReportCardService(grades);

  const aggregate: AggregateResult = {
    aggregateId: "aggregate-1",
    ...queryBase,
    subjectsOffered: 1,
    subjectsWithTotal: 0,
    subjectsMissingTotal: 1,
    subjectTotals: [{ subjectId: "math" }],
  };

  const report = await service.getReportCard({
    school: { schoolId: "school-1", name: "School" },
    ...queryBase,
    subjectIds: ["math"],
    gradeScale: { schoolId: "school-1", bands: [] },
    aggregate,
    attendance: { total: 10, male: 1, female: 0, present: 8, absent: 2 },
  }, { canView: true });

  assert.deepEqual(report.subjects, [{ subjectId: "math" }]);
  assert.equal(report.position, undefined);
});

test("report card requires permission", async () => {
  const results = new ResultsService(new CAInMemoryRepository(), new ExamInMemoryRepository());
  const service = new ReportCardService(new GradeService(new TotalsService(results)));

  await assert.rejects(
    service.getReportCard({
      school: { schoolId: "school-1", name: "School" },
      ...queryBase,
      subjectIds: [],
      gradeScale: { schoolId: "school-1", bands: [] },
      aggregate: {
        aggregateId: "aggregate-1",
        ...queryBase,
        subjectsOffered: 0,
        subjectsWithTotal: 0,
        subjectsMissingTotal: 0,
        subjectTotals: [],
      },
      attendance: { total: 0, male: 0, female: 0, present: 0, absent: 0 },
    }, { canView: false }),
    /not permitted/,
  );
});
