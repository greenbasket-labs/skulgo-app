import assert from "node:assert/strict";
import test from "node:test";

import { SqliteChangeStore } from "../packages/sync/src/sqlite-store";

class FakeSqlite {
  private readonly rows = new Map<string, {
    change_id: string;
    state: "queued" | "sending" | "acknowledged" | "conflict";
    acknowledged_at?: string;
    change_json: string;
  }>();

  async run(sql: string, params: unknown[] = []): Promise<void> {
    if (sql.includes("INSERT OR IGNORE")) {
      const [changeId, json] = params as [string, string];
      if (!this.rows.has(changeId)) {
        this.rows.set(changeId, {
          change_id: changeId,
          state: "queued",
          change_json: json,
        });
      }
    }

    if (sql.includes("SET state = 'acknowledged'")) {
      const [acknowledgedAt, changeId] = params as [string, string];
      const row = this.rows.get(changeId);
      if (row) {
        row.state = "acknowledged";
        row.acknowledged_at = acknowledgedAt;
      }
    }
  }

  async all<T>(): Promise<T[]> {
    return [...this.rows.values()] as T[];
  }

  async get<T>(_sql: string, params: unknown[] = []): Promise<T | undefined> {
    return this.rows.get(String(params[0])) as T | undefined;
  }
}

test("SQLite outbox survives a store instance restart", async () => {
  const db = new FakeSqlite();
  const first = new SqliteChangeStore(db);

  await first.initialize();
  await first.save({
    changeId: "change-1",
    actorUserId: "teacher-1",
    actorDeviceId: "teacher-phone",
    createdAt: "2026-10-01T08:00:00.000Z",
    record: {
      recordId: "attendance-1",
      schoolId: "school-1",
      userId: "teacher-1",
      deviceId: "teacher-phone",
      recordType: "attendance",
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
      entityVersion: 1,
      classId: "ss1",
      studentId: "student-1",
      sessionId: "2026-2027",
      termId: "first",
      visibility: "school_official",
      payload: { date: "2026-10-01", status: "present" },
    },
  });

  const restarted = new SqliteChangeStore(db);
  const pending = await restarted.pending();

  assert.equal(pending.length, 1);
  assert.equal(pending[0].change.changeId, "change-1");
  assert.equal(pending[0].change.record.recordId, "attendance-1");
});
