import assert from "node:assert/strict";
import test from "node:test";

import { canCreateTeacherAssignment } from "../packages/identity/src/assignments";
import { buildReportCard } from "../packages/report-card/src/build";
import type { AttendanceRecord } from "../packages/attendance/src/model";
import type { SubjectResultRecord } from "../packages/results/src/model";

const identity = {
  schoolId: "school-1",
  classId: "ss1",
  studentId: "student-1",
  sessionId: "2026-2027",
  termId: "first",
};

function result(
  subjectId: string,
  score: number,
  grade: string,
): SubjectResultRecord {
  return {
    recordId: "result-" + subjectId,
    schoolId: identity.schoolId,
    userId: "teacher-math",
    deviceId: "teacher-phone",
    recordType: "subject_result",
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    entityVersion: 1,
    sessionId: identity.sessionId,
    termId: identity.termId,
    classId: identity.classId,
    subjectId,
    studentId: identity.studentId,
    visibility: "school_official",
    payload: {
      ca: { score: 28, maxScore: 30 },
      exam: { score, maxScore: 70 },
      total: 28 + score,
      grade,
    },
  };
}

function attendance(
  recordId: string,
  date: string,
  status: "present" | "absent",
): AttendanceRecord {
  return {
    recordId,
    schoolId: identity.schoolId,
    userId: "teacher-math",
    deviceId: "teacher-phone",
    recordType: "attendance",
    createdAt: date + "T08:00:00.000Z",
    updatedAt: date + "T08:00:00.000Z",
    entityVersion: 1,
    sessionId: identity.sessionId,
    termId: identity.termId,
    classId: identity.classId,
    studentId: identity.studentId,
    visibility: "school_official",
    payload: { date, status },
  };
}

test("one teacher owns a class + subject assignment", () => {
  const existing = [{
    assignmentId: "a1",
    schoolId: "school-1",
    teacherUserId: "teacher-math",
    classId: "ss1",
    assignmentType: "SUBJECT_TEACHER",
    subjectId: "math",
    status: "ACTIVE",
    createdAt: "2026-10-01T08:00:00.000Z",
  }];

  assert.equal(
    canCreateTeacherAssignment(existing, {
      assignmentId: "a2",
      schoolId: "school-1",
      teacherUserId: "teacher-other",
      classId: "ss1",
      assignmentType: "SUBJECT_TEACHER",
      subjectId: "math",
      status: "ACTIVE",
      createdAt: "2026-10-01T08:00:00.000Z",
    }),
    false,
  );
});

test("report card consumes the same result and attendance records", () => {
  const report = buildReportCard(
    identity,
    [result("math", 62, "A"), result("english", 55, "B")],
    [
      attendance("att-1", "2026-09-28", "present"),
      attendance("att-2", "2026-09-29", "absent"),
    ],
  );

  assert.equal(report.subjects.length, 2);
  assert.equal(report.subjects[0].result?.payload.total, 90);
  assert.equal(report.attendance.length, 2);
  assert.equal(report.attendance[1].payload.status, "absent");
});
