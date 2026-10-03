import assert from "node:assert/strict";
import test from "node:test";

import { recordAttendance } from "../packages/attendance/src/service";
import { ReplicationNode, connectNodes } from "../packages/sync/src/node";
import { MemoryChangeStore } from "../packages/sync/src/store";
import { AttendanceRepository } from "../packages/attendance/src/repository";
import { IdentityRepository } from "../packages/identity/src/sqlite-repository";
import type { LocalRecordStore, LocalSchoolRecord } from "../packages/school-records/src/repository";

class FakeIdentityDb {
  private readonly rows = new Map<string, any[]>();
  async run(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.includes("INSERT INTO local_teacher_assignments")) {
      const row = { assignment_id: params[0], school_id: params[1], teacher_user_id: params[2], class_id: params[3], subject_id: params[4], created_at: params[5] };
      this.rows.set("assignments", [...(this.rows.get("assignments") ?? []), row]);
    }
    if (sql.includes("INSERT OR REPLACE INTO local_students")) {
      const row = { student_id: params[0], school_id: params[1], class_id: params[2], admission_number: params[3], display_name: params[4], created_at: params[5] };
      this.rows.set("students", [...(this.rows.get("students") ?? []), row]);
    }
  }
  async get<T>(_sql: string, params: unknown[] = []): Promise<T | undefined> {
    const row = (this.rows.get("assignments") ?? []).find((r) => r.school_id === params[0] && r.teacher_user_id === params[1] && r.class_id === params[2] && r.subject_id === params[3]);
    return row as T | undefined;
  }
  async all<T>(_sql: string, params: unknown[] = []): Promise<T[]> {
    return (this.rows.get("students") ?? []).filter((r) => r.school_id === params[0] && r.class_id === params[1]) as T[];
  }
}

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
  const identityDb = new FakeIdentityDb();
  const identityRepository = new IdentityRepository(identityDb);
  await identityRepository.initialize();
  await identityRepository.saveTeacherAssignment({ assignmentId: "a1", schoolId: "school-1", teacherUserId: "teacher-1", classId: "ss1", subjectId: "math", createdAt: "2026-10-01T08:00:00.000Z" });
  await identityRepository.saveStudent({ studentId: "student-1", schoolId: "school-1", classId: "ss1", displayName: "Aisha", createdAt: "2026-10-01T08:00:00.000Z" });

  const record = await recordAttendance(teacher, attendanceRepository, identityRepository, {
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
  const identityRepository = new IdentityRepository(new FakeIdentityDb());

  assert.throws(
    () =>
      recordAttendance(teacher, attendanceRepository, identityRepository, {
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
