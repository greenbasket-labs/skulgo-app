import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryCARepository } from "../packages/ca/src/in-memory-repository";
import { InMemoryExamRepository } from "../packages/exam/src/in-memory-repository";
import { ResultsService } from "../packages/results/src/service";
import { TotalsService } from "../packages/totals/src/service";
import { AggregateService } from "../packages/aggregate/src/service";

const base = {
  schoolId: "school-1",
  studentId: "student-1",
  classId: "class-1",
  sessionId: "session-1",
  termId: "term-1",
};

function makeService() {
  const ca = new InMemoryCARepository();
  const exam = new InMemoryExamRepository();
  return { ca, exam, service: new AggregateService(new TotalsService(new ResultsService(ca, exam))) };
}

async function addSubjectTotal(
  ca: InMemoryCARepository,
  exam: InMemoryExamRepository,
  subjectId: string,
  total: number,
) {
  await ca.saveRecord({
    caId: `ca-${subjectId}`,
    schoolId: "school-1",
    studentId: "student-1",
    classId: "class-1",
    subjectId,
    teacherId: "teacher-1",
    sessionId: "session-1",
    termId: "term-1",
    assessmentName: "CA 1",
    maximumScore: 100,
    score: total,
    date: "2026-10-01",
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
  });
}

test("aggregate handles a student offering 9 subjects", async () => {
  const { ca, exam, service } = makeService();
  const subjectIds = Array.from({ length: 9 }, (_, i) => `subject-${i + 1}`);
  for (const [i, subjectId] of subjectIds.entries()) {
    await addSubjectTotal(ca, exam, subjectId, 100 + i);
  }

  const result = await service.getAggregate(
    { ...base, subjectIds },
    { canView: true },
  );

  assert.equal(result.subjectCount, 9);
  assert.equal(result.overallTotal, 936);
  assert.equal(result.average, 104);
});

test("aggregate handles a student offering 8 subjects", async () => {
  const { ca, exam, service } = makeService();
  const subjectIds = Array.from({ length: 8 }, (_, i) => `subject-${i + 1}`);
  for (const [i, subjectId] of subjectIds.entries()) {
    await addSubjectTotal(ca, exam, subjectId, 100 + i);
  }

  const result = await service.getAggregate(
    { ...base, subjectIds },
    { canView: true },
  );

  assert.equal(result.subjectCount, 8);
  assert.equal(result.overallTotal, 828);
  assert.equal(result.average, 103.5);
});

test("subjects without a recorded total are excluded from count and average", async () => {
  const { ca, exam, service } = makeService();
  await addSubjectTotal(ca, exam, "subject-1", 100);
  await addSubjectTotal(ca, exam, "subject-2", 80);

  const result = await service.getAggregate(
    { ...base, subjectIds: ["subject-1", "subject-2", "subject-3"] },
    { canView: true },
  );

  assert.equal(result.subjectCount, 2);
  assert.equal(result.overallTotal, 180);
  assert.equal(result.average, 90);
  assert.deepEqual(result.subjectTotals, [
    { subjectId: "subject-1", total: 100 },
    { subjectId: "subject-2", total: 80 },
  ]);
});

test("aggregate is empty when no subject has a recorded total", async () => {
  const { service } = makeService();
  const result = await service.getAggregate(
    { ...base, subjectIds: ["subject-1", "subject-2"] },
    { canView: true },
  );

  assert.equal(result.subjectCount, 0);
  assert.equal(result.overallTotal, undefined);
  assert.equal(result.average, undefined);
});
