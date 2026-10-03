import type { RecordChange, SchoolRecord } from "../../school-records/src/record";
import type { SqliteDatabase } from "./sqlite-store";
import type { ApplyResult } from "./node";

export interface TransactionalSqliteDatabase extends SqliteDatabase {
  transaction<T>(work: (db: SqliteDatabase) => Promise<T>): Promise<T>;
}

interface RecordRow {
  record_id: string;
  entity_version: number;
  payload_json: string;
}

export interface AdminReceivePolicy<T = unknown> {
  canReceive(change: RecordChange<T>): boolean;
}

/** Durable authoritative receiver for Primary/Trusted Admin nodes. */
export class SqliteAdminReplicationStore<T = unknown> {
  constructor(
    private readonly db: TransactionalSqliteDatabase,
    private readonly policy?: AdminReceivePolicy<T>,
  ) {}

  async initialize(): Promise<void> {
    await this.db.run("CREATE TABLE IF NOT EXISTS records (record_id TEXT PRIMARY KEY, school_id TEXT NOT NULL, record_type TEXT NOT NULL, created_by_user_id TEXT NOT NULL, created_by_device_id TEXT NOT NULL, session_id TEXT, term_id TEXT, class_id TEXT, subject_id TEXT, student_id TEXT, entity_version INTEGER NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload_json TEXT NOT NULL, visibility_scope TEXT NOT NULL)");
    await this.db.run("CREATE TABLE IF NOT EXISTS sync_inbox (change_id TEXT PRIMARY KEY, school_id TEXT NOT NULL, received_from_device_id TEXT NOT NULL, received_at TEXT NOT NULL, applied_at TEXT, state TEXT NOT NULL)");
    await this.db.run("CREATE TABLE IF NOT EXISTS sync_conflicts (conflict_id TEXT PRIMARY KEY, school_id TEXT NOT NULL, record_id TEXT NOT NULL, local_version INTEGER NOT NULL, remote_version INTEGER NOT NULL, local_payload_json TEXT NOT NULL, remote_payload_json TEXT NOT NULL, created_at TEXT NOT NULL, resolved_at TEXT)");
  }

  async receive(change: RecordChange<T>, receivedFromDeviceId = change.actorDeviceId, receivedAt = new Date().toISOString()): Promise<ApplyResult> {
    if (this.policy && !this.policy.canReceive(change)) throw new Error("Unauthorized replication change: " + change.changeId);

    return this.db.transaction(async (tx) => {
      const inbox = await tx.get<{ change_id: string }>("SELECT change_id FROM sync_inbox WHERE change_id = ?", [change.changeId]);
      if (inbox) return { status: "duplicate", changeId: change.changeId };

      const existing = await tx.get<RecordRow>("SELECT record_id, entity_version, payload_json FROM records WHERE record_id = ?", [change.record.recordId]);
      if (existing && change.record.entityVersion <= existing.entity_version) {
        await tx.run("INSERT INTO sync_inbox (change_id, school_id, received_from_device_id, received_at, applied_at, state) VALUES (?, ?, ?, ?, NULL, ?)", [change.changeId, change.record.schoolId, receivedFromDeviceId, receivedAt, "conflict"]);
        await tx.run("INSERT INTO sync_conflicts (conflict_id, school_id, record_id, local_version, remote_version, local_payload_json, remote_payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", ["conflict:" + change.changeId, change.record.schoolId, change.record.recordId, existing.entity_version, change.record.entityVersion, existing.payload_json, JSON.stringify(change.record.payload), receivedAt]);
        return { status: "conflict", changeId: change.changeId, recordVersion: existing.entity_version };
      }

      await tx.run("INSERT INTO records (record_id, school_id, record_type, created_by_user_id, created_by_device_id, session_id, term_id, class_id, subject_id, student_id, entity_version, created_at, updated_at, payload_json, visibility_scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(record_id) DO UPDATE SET entity_version = excluded.entity_version, updated_at = excluded.updated_at, payload_json = excluded.payload_json, visibility_scope = excluded.visibility_scope", [
        change.record.recordId, change.record.schoolId, change.record.recordType, change.record.userId, change.record.deviceId,
        change.record.sessionId ?? null, change.record.termId ?? null, change.record.classId ?? null, change.record.subjectId ?? null, change.record.studentId ?? null,
        change.record.entityVersion, change.record.createdAt, change.record.updatedAt, JSON.stringify(change.record.payload), change.record.visibility,
      ]);
      await tx.run("INSERT INTO sync_inbox (change_id, school_id, received_from_device_id, received_at, applied_at, state) VALUES (?, ?, ?, ?, ?, ?)", [change.changeId, change.record.schoolId, receivedFromDeviceId, receivedAt, receivedAt, "applied"]);
      return { status: "applied", changeId: change.changeId, recordVersion: change.record.entityVersion };
    });
  }

  async getOfficialRecord(recordId: string): Promise<SchoolRecord<T> | undefined> {
    const row = await this.db.get<any>("SELECT * FROM records WHERE record_id = ?", [recordId]);
    if (!row) return undefined;
    return { recordId: row.record_id, schoolId: row.school_id, recordType: row.record_type, userId: row.created_by_user_id, deviceId: row.created_by_device_id, sessionId: row.session_id, termId: row.term_id, classId: row.class_id, subjectId: row.subject_id, studentId: row.student_id, entityVersion: row.entity_version, createdAt: row.created_at, updatedAt: row.updated_at, visibility: row.visibility_scope, payload: JSON.parse(row.payload_json) as T };
  }
}