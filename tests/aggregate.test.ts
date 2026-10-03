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
  subjectId: string,
  total: number,
  studentId = "student-1",
) {
  await ca.saveRecord({
    caId: `ca-${studentId}-${subjectId}`,
    schoolId: "school-1",
    studentId,
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

test("aggregate uses all 9 subjects offered", async () => {
  const { ca, service } = makeService();
  const subjectIds = Array.from({ length: 9 }, (_, i) => `subject-${i + 1}`);
  for (const subjectId of subjectIds) await addSubjectTotal(ca, subjectId, 100);
  const result = await service.getAggregate({ ...base, subjectIds }, { canView: true });
  assert.equal(result.subjectsOffered, 9);
  assert.equal(result.subjectsWithTotal, 9);
  assert.equal(result.subjectsMissingTotal, 0);
  assert.equal(result.overallTotal, 900);
  assert.equal(result.average, 100);
});

test("aggregate uses all 8 subjects offered", async () => {
  const { ca, service } = makeService();
  const subjectIds = Array.from({ length: 8 }, (_, i) => `subject-${i + 1}`);
  for (const subjectId of subjectIds) await addSubjectTotal(ca, subjectId, 100);
  const result = await service.getAggregate({ ...base, subjectIds }, { canView: true });
  assert.equal(result.subjectsOffered, 8);
  assert.equal(result.subjectsWithTotal, 8);
  assert.equal(result.subjectsMissingTotal, 0);
  assert.equal(result.overallTotal, 800);
  assert.equal(result.average, 100);
});

test("9 subjects at 900 and 8 subjects at 800 normalize to the same average", async () => {
  const first = makeService();
  const second = makeService();
  const nine = Array.from({ length: 9 }, (_, i) => `subject-${i + 1}`);
  const eight = Array.from({ length: 8 }, (_, i) => `subject-${i + 1}`);
  for (const subjectId of nine) await addSubjectTotal(first.ca, subjectId, 100);
  for (const subjectId of eight) await addSubjectTotal(second.ca, subjectId, 100, "student-2");
  const [a, b] = await Promise.all([
    first.service.getAggregate({ ...base, subjectIds: nine }, { canView: true }),
    second.service.getAggregate({ ...base, studentId: "student-2", subjectIds: eight }, { canView: true }),
  ]);
  assert.equal(a.overallTotal, 900);
  assert.equal(b.overallTotal, 800);
  assert.equal(a.average, 100);
  assert.equal(b.average, 100);
});

test("offered subjects with no recorded total remain visible and count in the denominator", async () => {
  const { ca, service } = makeService();
  await addSubjectTotal(ca, "subject-1", 100);
  await addSubjectTotal(ca, "subject-2", 80);
  const result = await service.getAggregate({ ...base, subjectIds: ["subject-1", "subject-2", "subject-3"] }, { canView: true });
  assert.equal(result.subjectsOffered, 3);
  assert.equal(result.subjectsWithTotal, 2);
  assert.equal(result.subjectsMissingTotal, 1);
  assert.equal(result.overallTotal, 180);
  assert.equal(result.average, 60);
  assert.deepEqual(result.subjectTotals, [
    { subjectId: "subject-1", total: 100 },
    { subjectId: "subject-2", total: 80 },
    { subjectId: "subject-3" },
  ]);
});

test("aggregate is empty when no subject is offered", async () => {
  const { service } = makeService();
  const result = await service.getAggregate({ ...base, subjectIds: [] }, { canView: true });
  assert.equal(result.subjectsOffered, 0);
  assert.equal(result.subjectsWithTotal, 0);
  assert.equal(result.subjectsMissingTotal, 0);
  assert.equal(result.overallTotal, undefined);
  assert.equal(result.average, undefined);
});