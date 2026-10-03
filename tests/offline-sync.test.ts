import assert from "node:assert/strict";
import test from "node:test";

import { recordAttendance } from "../packages/attendance/src/service";
import { ReplicationNode, connectNodes } from "../packages/sync/src/node";
import { MemoryChangeStore } from "../packages/sync/src/store";
import { AttendanceRepository } from "../packages/attendance/src/repository";
import type { LocalRecordStore, LocalSchoolRecord } from "../packages/school-records/src/repository";

class TestRecordStore implements LocalRecordStore {
  readonly records = new Map<string, LocalSchoolRecord>();

  async put(record: LocalSchoolRecord): Promise<void> {
    this.records.set(record.recordId, record);
  }

  async get(recordId: string): Promise<LocalSchoolRecord | undefined> {
    return this.records.get(recordId);
  }

  async listByType(schoolId: string, recordType: string): Promise<LocalSchoolRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.schoolId === schoolId && record.recordType === recordType,
    );
  }
}

test("teacher records attendance offline, then syncs to admin", async () => {
  const teacherStore = new MemoryChangeStore();
  const teacher = new ReplicationNode("teacher-phone", teacherStore);
  const admin = new ReplicationNode("admin-phone", new MemoryChangeStore());
  const localStore = new TestRecordStore();
  const attendanceRepository = new AttendanceRepository(localStore);

  const record = await recordAttendance(teacher, attendanceRepository, {
    schoolId: "school-1",
    teacherUserId: "teacher-1",
    deviceId: "teacher-phone",
    assignment: {
      assignmentId: "assignment-1",
      schoolId: "school-1",
      teacherUserId: "teacher-1",
      classId: "ss1",
      subjectId: "math",
      createdAt: "2026-10-01T08:00:00.000Z",
    },
    classId: "ss1",
    studentId: "student-1",
    sessionId: "2026-2027",
    termId: "first",
    date: "2026-10-01",
    status: "present",
  });

  assert.equal((await localStore.get(record.recordId))?.recordId, record.recordId);
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


test("teacher cannot record attendance outside their assignment", () => {
  const teacher = new ReplicationNode("teacher-phone", new MemoryChangeStore());
  const attendanceRepository = new AttendanceRepository(new TestRecordStore());

  assert.throws(
    () =>
      recordAttendance(teacher, attendanceRepository, {
        schoolId: "school-1",
        teacherUserId: "teacher-1",
        deviceId: "teacher-phone",
        assignment: {
          assignmentId: "assignment-1",
          schoolId: "school-1",
          teacherUserId: "teacher-1",
          classId: "ss2",
          subjectId: "math",
          createdAt: "2026-10-01T08:00:00.000Z",
        },
        classId: "ss1",
        studentId: "student-1",
        sessionId: "2026-2027",
        termId: "first",
        date: "2026-10-01",
        status: "present",
      }),
    /not assigned to this class/,
  );
});
