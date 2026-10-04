import assert from "node:assert/strict";
import test from "node:test";
import { summarizeAttendance } from "../packages/attendance/src/summary";
import { createAttendanceDutyOverview } from "../packages/attendance/src/duty-overview";

const assignment = {
  assignmentId: "assignment-1",
  schoolId: "school-1",
  teacherUserId: "teacher-user-1",
  classId: "class-1",
  assignmentType: "CLASS_MASTER",
  status: "ACTIVE",
  createdAt: "2026-10-03T08:00:00.000Z",
};

test("attendance summary returns total, M/F, present, and absent", () => {
  const records = [
    { studentId: "s1", payload: { status: "present" as const } },
    { studentId: "s2", payload: { status: "absent" as const } },
    { studentId: "s3", payload: { status: "present" as const } },
  ] as any;

  const summary = summarizeAttendance(records, [
    { studentId: "s1", gender: "M" },
    { studentId: "s2", gender: "F" },
    { studentId: "s3", gender: "F" },
  ]);

  assert.deepEqual(summary, {
    total: 3,
    male: 1,
    female: 2,
    present: 2,
    absent: 1,
  });
});

test("admin and assigned Class Master can use the same duty overview", () => {
  const summary = { total: 3, male: 1, female: 2, present: 2, absent: 1 };

  const adminView = createAttendanceDutyOverview(
    assignment,
    "monthly",
    summary,
    { userId: "admin-1", canViewAll: true },
  );
  const assignedUserView = createAttendanceDutyOverview(
    assignment,
    "monthly",
    summary,
    { userId: "teacher-user-1", canViewAll: false },
  );

  assert.deepEqual(adminView, assignedUserView);
});

test("unassigned user cannot use the duty overview", () => {
  assert.throws(
    () =>
      createAttendanceDutyOverview(
        assignment,
        "daily",
        { total: 0, male: 0, female: 0, present: 0, absent: 0 },
        { userId: "teacher-user-2", canViewAll: false },
      ),
    /not permitted/,
  );
});
