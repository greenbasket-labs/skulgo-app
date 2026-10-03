import type { RecordChange } from "../../school-records/src/record";
import type { ChangeStore, StoredChange } from "./store";

export interface SqliteDatabase {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
}

interface OutboxRow {
  change_id: string;
  state: StoredChange["state"];
  acknowledged_at?: string;
  change_json: string;
}

/**
 * SQLite-backed outbox adapter.
 *
 * The device runtime supplies the SQLite implementation. The outbox
 * is persisted independently from UI state so queued work survives
 * application restarts.
 */
export class SqliteChangeStore<T = unknown> {
  constructor(private readonly db: SqliteDatabase) {}

  async initialize(): Promise<void> {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_outbox_runtime (
        change_id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        acknowledged_at TEXT,
        change_json TEXT NOT NULL
      )
    `);
  }

  async save(change: RecordChange<T>): Promise<void> {
    await this.db.run(
      `INSERT OR IGNORE INTO sync_outbox_runtime
       (change_id, state, change_json) VALUES (?, 'queued', ?)`,
      [change.changeId, JSON.stringify(change)],
    );
  }

  async get(changeId: string): Promise<StoredChange<T> | undefined> {
    const row = await this.db.get<OutboxRow>(
      `SELECT change_id, state, acknowledged_at, change_json
       FROM sync_outbox_runtime WHERE change_id = ?`,
      [changeId],
    );

    return row
      ? {
          change: JSON.parse(row.change_json) as RecordChange<T>,
          state: row.state,
          acknowledgedAt: row.acknowledged_at,
        }
      : undefined;
  }

  async pending(): Promise<StoredChange<T>[]> {
    const rows = await this.db.all<OutboxRow>(
      `SELECT change_id, state, acknowledged_at, change_json
       FROM sync_outbox_runtime
       WHERE state IN ('queued', 'sending')
       ORDER BY rowid ASC`,
    );

    return rows.map((row) => ({
      change: JSON.parse(row.change_json) as RecordChange<T>,
      state: row.state,
      acknowledgedAt: row.acknowledged_at,
    }));
  }

  async acknowledge(changeId: string, acknowledgedAt: string): Promise<void> {
    await this.db.run(
      `UPDATE sync_outbox_runtime
       SET state = 'acknowledged', acknowledged_at = ?
       WHERE change_id = ?`,
      [acknowledgedAt, changeId],
    );
  }
}
