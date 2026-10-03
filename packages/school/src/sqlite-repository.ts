import type { SqliteDatabase } from "../../sync/src/sqlite-store";
import type { AcademicSession, AcademicTerm, SchoolProfile } from "./domain";
import type { SchoolRepository } from "./repository";

export class SqliteSchoolRepository implements SchoolRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async initialize(): Promise<void> {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS local_schools (
        school_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        school_type TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        logo_url TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS academic_sessions (
        session_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS academic_terms (
        term_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);
  }

  async getSchool(schoolId: string): Promise<SchoolProfile | undefined> {
    const row = await this.db.get<any>(`SELECT * FROM local_schools WHERE school_id = ?`, [schoolId]);
    return row ? this.mapSchool(row) : undefined;
  }

  async saveSchool(school: SchoolProfile): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_schools
       (school_id, name, school_type, phone, email, address, logo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [school.schoolId, school.name, school.schoolType ?? null, school.phone ?? null,
       school.email ?? null, school.address ?? null, school.logoUrl ?? null, school.createdAt],
    );
  }

  async listSessions(schoolId: string): Promise<AcademicSession[]> {
    const rows = await this.db.all<any>(
      `SELECT * FROM academic_sessions WHERE school_id = ? ORDER BY created_at ASC`, [schoolId],
    );
    return rows.map((row) => this.mapSession(row));
  }

  async saveSession(session: AcademicSession): Promise<void> {
    if (session.isCurrent) {
      await this.db.run(`UPDATE academic_sessions SET is_current = 0 WHERE school_id = ?`, [session.schoolId]);
    }
    await this.db.run(
      `INSERT OR REPLACE INTO academic_sessions
       (session_id, school_id, name, is_current, created_at) VALUES (?, ?, ?, ?, ?)`,
      [session.sessionId, session.schoolId, session.name, session.isCurrent ? 1 : 0, session.createdAt],
    );
  }

  async getCurrentSession(schoolId: string): Promise<AcademicSession | undefined> {
    const row = await this.db.get<any>(
      `SELECT * FROM academic_sessions WHERE school_id = ? AND is_current = 1 LIMIT 1`, [schoolId],
    );
    return row ? this.mapSession(row) : undefined;
  }

  async listTerms(schoolId: string, sessionId: string): Promise<AcademicTerm[]> {
    const rows = await this.db.all<any>(
      `SELECT * FROM academic_terms
       WHERE school_id = ? AND session_id = ? ORDER BY created_at ASC`,
      [schoolId, sessionId],
    );
    return rows.map((row) => this.mapTerm(row));
  }

  async saveTerm(term: AcademicTerm): Promise<void> {
    if (term.isCurrent) {
      await this.db.run(`UPDATE academic_terms SET is_current = 0 WHERE school_id = ?`, [term.schoolId]);
    }
    await this.db.run(
      `INSERT OR REPLACE INTO academic_terms
       (term_id, school_id, session_id, name, is_current, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [term.termId, term.schoolId, term.sessionId, term.name, term.isCurrent ? 1 : 0, term.createdAt],
    );
  }

  async getCurrentTerm(schoolId: string): Promise<AcademicTerm | undefined> {
    const row = await this.db.get<any>(
      `SELECT * FROM academic_terms WHERE school_id = ? AND is_current = 1 LIMIT 1`, [schoolId],
    );
    return row ? this.mapTerm(row) : undefined;
  }

  private mapSchool(row: any): SchoolProfile {
    return {
      schoolId: row.school_id, name: row.name, schoolType: row.school_type ?? undefined,
      phone: row.phone ?? undefined, email: row.email ?? undefined,
      address: row.address ?? undefined, logoUrl: row.logo_url ?? undefined, createdAt: row.created_at,
    };
  }

  private mapSession(row: any): AcademicSession {
    return {
      sessionId: row.session_id, schoolId: row.school_id, name: row.name,
      isCurrent: row.is_current === 1, createdAt: row.created_at,
    };
  }

  private mapTerm(row: any): AcademicTerm {
    return {
      termId: row.term_id, schoolId: row.school_id, sessionId: row.session_id, name: row.name,
      isCurrent: row.is_current === 1, createdAt: row.created_at,
    };
  }
}
