import type {
  LocalRecordStore,
  LocalSchoolRecord,
} from "./repository";
import type { SqliteDatabase } from "../../sync/src/sqlite-store";

interface RecordRow {
  record_id: string;
  school_id: string;
  record_type: string;
  created_by_user_id: string;
  created_by_device_id: string;
  session_id?: string;
  term_id?: string;
  class_id?: string;
  subject_id?: string;
  student_id?: string;
  entity_version: number;
  created_at: string;
  updated_at: string;
  payload_json: string;
  visibility_scope: string;
}

function toRecord(row: RecordRow): LocalSchoolRecord {
  return {
    recordId: row.record_id,
    schoolId: row.school_id,
    recordType: row.record_type,
    createdByUserId: row.created_by_user_id,
    createdByDeviceId: row.created_by_device_id,
    sessionId: row.session_id,
    termId: row.term_id,
    classId: row.class_id,
    subjectId: row.subject_id,
    studentId: row.student_id,
    entityVersion: row.entity_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    payload: JSON.parse(row.payload_json),
    visibilityScope: row.visibility_scope,
  };
}

export class SqliteRecordStore implements LocalRecordStore {
  constructor(private readonly db: SqliteDatabase) {}

  async initialize(): Promise<void> {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS local_records (
        record_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        record_type TEXT NOT NULL,
        created_by_user_id TEXT NOT NULL,
        created_by_device_id TEXT NOT NULL,
        session_id TEXT,
        term_id TEXT,
        class_id TEXT,
        subject_id TEXT,
        student_id TEXT,
        entity_version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        visibility_scope TEXT NOT NULL
      )
    `);
  }

  async put(record: LocalSchoolRecord): Promise<void> {
    await this.db.run(
      `INSERT INTO local_records (
        record_id, school_id, record_type, created_by_user_id,
        created_by_device_id, session_id, term_id, class_id,
        subject_id, student_id, entity_version, created_at,
        updated_at, payload_json, visibility_scope
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(record_id) DO UPDATE SET
        entity_version = excluded.entity_version,
        updated_at = excluded.updated_at,
        payload_json = excluded.payload_json,
        visibility_scope = excluded.visibility_scope`,
      [
        record.recordId,
        record.schoolId,
        record.recordType,
        record.createdByUserId,
        record.createdByDeviceId,
        record.sessionId ?? null,
        record.termId ?? null,
        record.classId ?? null,
        record.subjectId ?? null,
        record.studentId ?? null,
        record.entityVersion,
        record.createdAt,
        record.updatedAt,
        JSON.stringify(record.payload),
        record.visibilityScope,
      ],
    );
  }

  async get(recordId: string): Promise<LocalSchoolRecord | undefined> {
    const row = await this.db.get<RecordRow>(
      "SELECT * FROM local_records WHERE record_id = ?",
      [recordId],
    );

    return row ? toRecord(row) : undefined;
  }

  async listByType(
    schoolId: string,
    recordType: string,
  ): Promise<LocalSchoolRecord[]> {
    const rows = await this.db.all<RecordRow>(
      `SELECT * FROM local_records
       WHERE school_id = ? AND record_type = ?
       ORDER BY created_at ASC`,
      [schoolId, recordType],
    );

    return rows.map(toRecord);
  }
}
