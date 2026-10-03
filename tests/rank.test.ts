import assert from "node:assert/strict";
import test from "node:test";
import { RankService } from "../packages/rank/src/service";
import type { AggregateResult } from "../packages/aggregate/src/model";

const base = {
  schoolId: "school-1",
  classId: "class-1",
  sessionId: "session-1",
  termId: "term-1",
};

function aggregate(
  studentId: string,
  average: number,
  subjectsOffered: number,
  classId = base.classId,
): AggregateResult {
  return {
    aggregateId: studentId + ":aggregate",
    ...base,
    classId,
    studentId,
    subjectsOffered,
    subjectsWithTotal: subjectsOffered,
    subjectsMissingTotal: 0,
    overallTotal: average * subjectsOffered,
    average,
    subjectTotals: [],
  };
}

test("rank uses normalized average and gives equal averages the same position", () => {
  const service = new RankService();
  const result = service.getRank(base, [
    aggregate("musa", 100, 9),
    aggregate("aisha", 100, 8),
    aggregate("fatima", 95, 9),
    aggregate("ali", 94, 8),
  ], { canView: true });

  assert.deepEqual(result.entries.map((entry) => [entry.studentId, entry.average, entry.position]), [
    ["musa", 100, 1],
    ["aisha", 100, 1],
    ["fatima", 95, 3],
    ["ali", 94, 4],
  ]);
});

test("rank preserves students with missing totals without assigning a position", () => {
  const service = new RankService();
  const missing = aggregate("missing", 0, 3);
  missing.average = undefined;
  missing.overallTotal = undefined;

  const result = service.getRank(base, [
    aggregate("musa", 100, 9),
    missing,
  ], { canView: true });

  assert.equal(result.entries.find((entry) => entry.studentId === "missing")?.position, undefined);
  assert.equal(result.entries.find((entry) => entry.studentId === "missing")?.subjectsOffered, 3);
});

test("school rank returns positions 1st, 2nd and 3rd, including ties at those positions", () => {
  const service = new RankService();
  const result = service.getSchoolTopPositions(
    { schoolId: "school-1", sessionId: "session-1", termId: "term-1" },
    [
      aggregate("musa", 100, 9, "class-1"),
      aggregate("aisha", 100, 8, "class-2"),
      aggregate("fatima", 95, 9, "class-3"),
      aggregate("ali", 94, 8, "class-1"),
    ],
    { canView: true },
  );

  assert.deepEqual(result.entries.map((entry) => [entry.studentId, entry.position]), [
    ["musa", 1],
    ["aisha", 1],
    ["fatima", 3],
  ]);
  assert.equal(result.entries.length, 3);
});

test("school rank includes every student tied at a displayed position", () => {
  const service = new RankService();
  const result = service.getSchoolTopPositions(
    { schoolId: "school-1", sessionId: "session-1", termId: "term-1" },
    [
      aggregate("musa", 100, 9, "class-1"),
      aggregate("aisha", 100, 8, "class-2"),
      aggregate("fatima", 100, 9, "class-3"),
      aggregate("ali", 95, 8, "class-1"),
    ],
    { canView: true },
  );

  assert.deepEqual(result.entries.map((entry) => [entry.studentId, entry.position]), [
    ["musa", 1],
    ["aisha", 1],
    ["fatima", 1],
  ]);
});

test("rank rejects viewers without permission", () => {
  const service = new RankService();
  assert.throws(() => service.getRank(base, [], { canView: false }), /permission required/);
});
