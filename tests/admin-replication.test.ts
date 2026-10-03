import assert from "node:assert/strict";
import test from "node:test";
import { SqliteAdminReplicationStore } from "../packages/sync/src/admin-store";

class FakeAdminDb {
  private rows = new Map<string, any>();
  private inbox = new Set<string>();
  async run(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.includes("INSERT INTO records")) {
      const [recordId, schoolId, recordType, userId, deviceId, sessionId, termId, classId, subjectId, studentId, version, createdAt, updatedAt, payloadJson, visibility] = params;
      this.rows.set(String(recordId), { record_id: recordId, school_id: schoolId, record_type: recordType, created_by_user_id: userId, created_by_device_id: deviceId, session_id: sessionId, term_id: termId, class_id: classId, subject_id: subjectId, student_id: studentId, entity_version: version, created_at: createdAt, updated_at: updatedAt, payload_json: payloadJson, visibility_scope: visibility });
    }
    if (sql.includes("INSERT INTO sync_inbox")) this.inbox.add(String(params[0]));
  }
  async all<T>(): Promise<T[]> { return []; }
  async get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const id = String(params[0]);
    if (sql.includes("FROM records")) return this.rows.get(id) as T | undefined;
    if (sql.includes("FROM sync_inbox") && this.inbox.has(id)) return { change_id: id } as T;
    return undefined;
  }
  async transaction<T>(work: (db: any) => Promise<T>): Promise<T> { return work(this); }
}
function change(version = 1, changeId = "attendance-change-" + version) { return { changeId, actorUserId: "teacher-1", actorDeviceId: "teacher-phone", createdAt: "2026-10-01T08:00:00.000Z", record: { recordId: "attendance-1", schoolId: "school-1", userId: "teacher-1", deviceId: "teacher-phone", recordType: "attendance" as const, createdAt: "2026-10-01T08:00:00.000Z", updatedAt: "2026-10-01T08:00:00.000Z", entityVersion: version, classId: "ss1", studentId: "student-1", sessionId: "2026-2027", termId: "first", visibility: "school_official" as const, payload: { date: "2026-10-01", status: "present" as const } } }; }

test("admin persists incoming record before acknowledging it", async () => { const store = new SqliteAdminReplicationStore(new FakeAdminDb()); const result = await store.receive(change()); assert.equal(result.status, "applied"); assert.equal((await store.getOfficialRecord("attendance-1"))?.entityVersion, 1); });
test("admin treats the same change id as a durable duplicate", async () => { const store = new SqliteAdminReplicationStore(new FakeAdminDb()); assert.equal((await store.receive(change())).status, "applied"); assert.equal((await store.receive(change())).status, "duplicate"); });
test("admin rejects stale versions without overwriting the official record", async () => { const store = new SqliteAdminReplicationStore(new FakeAdminDb()); assert.equal((await store.receive(change(2))).status, "applied"); assert.equal((await store.receive(change(1))).status, "conflict"); assert.equal((await store.getOfficialRecord("attendance-1"))?.entityVersion, 2); });