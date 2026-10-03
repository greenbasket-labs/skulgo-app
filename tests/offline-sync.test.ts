import assert from "node:assert/strict";
import test from "node:test";

import { recordAttendance } from "../packages/attendance/src/service";
import { ReplicationNode, connectNodes } from "../packages/sync/src/node";
import { MemoryChangeStore } from "../packages/sync/src/store";

test("teacher records attendance offline, then syncs to admin", async () => {
  const teacherStore = new MemoryChangeStore();
  const teacher = new ReplicationNode("teacher-phone", teacherStore);
  const admin = new ReplicationNode("admin-phone", new MemoryChangeStore());

  const record = recordAttendance(teacher, {
    schoolId: "school-1",
    teacherUserId: "teacher-1",
    deviceId: "teacher-phone",
    classId: "ss1",
    studentId: "student-1",
    sessionId: "2026-2027",
    termId: "first",
    date: "2026-10-01",
    status: "present",
  });

  assert.equal(admin.getRecord(record.recordId), undefined);
  assert.equal(teacherStore.pending().length, 1);

  await teacher.flush(connectNodes(teacher, admin));

  assert.equal(admin.getRecord(record.recordId)?.payload.status, "present");
  assert.equal(teacherStore.pending().length, 0);
});

test("duplicate delivery is idempotent", () => {
  const admin = new ReplicationNode("admin-phone", new MemoryChangeStore());

  const change = {
    changeId: "change-1",
    actorUserId: "teacher-1",
    actorDeviceId: "teacher-phone",
    createdAt: "2026-10-01T08:00:00.000Z",
    record: {
      recordId: "attendance-1",
      schoolId: "school-1",
      userId: "teacher-1",
      deviceId: "teacher-phone",
      recordType: "attendance" as const,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      entityVersion: 1,
      classId: "ss1",
      studentId: "student-1",
      sessionId: "2026-2027",
      termId: "first",
      visibility: "school_official" as const,
      payload: { date: "2026-10-01", status: "present" as const },
    },
  };

  assert.equal(admin.receive(change).status, "applied");
  assert.equal(admin.receive(change).status, "duplicate");
});
