import type { SqliteDatabase } from "../../sync/src/sqlite-store";
import type {
  LocalClass,
  LocalDevice,
  LocalSchool,
  LocalStudent,
  LocalSubject,
  LocalTeacherAssignment,
  LocalUser,
} from "./repository";

export class IdentityRepository {
  constructor(private readonly db: SqliteDatabase) {}

  async initialize(): Promise<void> {
    const assignmentColumns = await this.db.all<{ name: string }>("PRAGMA table_info(local_teacher_assignments)");
    if (assignmentColumns.length > 0 && !assignmentColumns.some((column) => column.name === "assignment_type")) {
      await this.db.run("ALTER TABLE local_teacher_assignments RENAME TO local_teacher_assignments_legacy");
    }

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

      CREATE TABLE IF NOT EXISTS local_users (
        user_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_devices (
        device_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        node_type TEXT NOT NULL,
        is_trusted INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        last_seen_at TEXT
      );

      CREATE TABLE IF NOT EXISTS local_classes (
        class_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_subjects (
        subject_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_students (
        student_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        admission_number TEXT,
        display_name TEXT NOT NULL,
        gender TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_teacher_assignments (
        assignment_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        teacher_user_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        assignment_type TEXT NOT NULL,
        subject_id TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        UNIQUE (school_id, class_id, assignment_type, subject_id)
      )
    `);
    try {
      await this.db.run("ALTER TABLE local_students ADD COLUMN gender TEXT");
    } catch {
      // Existing local databases may already contain the column.
    }
    try { await this.db.run("ALTER TABLE local_users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'"); } catch {}
    try { await this.db.run("ALTER TABLE local_devices ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'"); } catch {}
  }

  async saveSchool(school: LocalSchool): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_schools
       (school_id, name, school_type, phone, email, address, logo_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [school.schoolId, school.name, school.schoolType ?? null, school.phone ?? null,
        school.email ?? null, school.address ?? null, school.logoUrl ?? null, school.createdAt],
    );
  }

  async saveUser(user: LocalUser): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_users
       (user_id, school_id, role, display_name, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.userId, user.schoolId, user.role, user.displayName, user.status ?? "ACTIVE", user.createdAt],
    );
  }

  async saveDevice(device: LocalDevice): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_devices
       (device_id, school_id, user_id, node_type, is_trusted, status, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        device.deviceId,
        device.schoolId,
        device.userId,
        device.nodeType,
        device.isTrusted ? 1 : 0,
        device.status ?? "ACTIVE",
        device.createdAt,
        device.lastSeenAt ?? null,
      ],
    );
  }

  async saveClass(item: LocalClass): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_classes
       (class_id, school_id, name, created_at) VALUES (?, ?, ?, ?)`,
      [item.classId, item.schoolId, item.name, item.createdAt],
    );
  }

  async saveSubject(item: LocalSubject): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_subjects
       (subject_id, school_id, name, created_at) VALUES (?, ?, ?, ?)`,
      [item.subjectId, item.schoolId, item.name, item.createdAt],
    );
  }

  async saveStudent(item: LocalStudent): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_students
       (student_id, school_id, class_id, admission_number, display_name, gender, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        item.studentId,
        item.schoolId,
        item.classId,
        item.admissionNumber ?? null,
        item.displayName,
        item.gender ?? null,
        item.createdAt,
      ],
    );
  }

  async saveTeacherAssignment(item: LocalTeacherAssignment): Promise<void> {
    await this.db.run(
      `INSERT INTO local_teacher_assignments
       (assignment_id, school_id, teacher_user_id, class_id, assignment_type, subject_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.assignmentId, item.schoolId, item.teacherUserId, item.classId, item.assignmentType, item.subjectId ?? null, item.status, item.createdAt],
    );
  }

  async findClassMasterAssignment(schoolId: string, teacherUserId: string, classId: string): Promise<LocalTeacherAssignment | undefined> {
    const row = await this.db.get<any>(
      `SELECT * FROM local_teacher_assignments WHERE school_id = ? AND teacher_user_id = ? AND class_id = ? AND assignment_type = 'CLASS_MASTER' AND status = 'ACTIVE'`,
      [schoolId, teacherUserId, classId],
    );
    return row ? { assignmentId: row.assignment_id, schoolId: row.school_id, teacherUserId: row.teacher_user_id, classId: row.class_id, assignmentType: row.assignment_type, subjectId: row.subject_id ?? undefined, status: row.status, createdAt: row.created_at } : undefined;
  }

  async findTeacherAssignment(schoolId: string, teacherUserId: string, classId: string, subjectId: string): Promise<LocalTeacherAssignment | undefined> {
    const row = await this.db.get<any>(
      `SELECT * FROM local_teacher_assignments WHERE school_id = ? AND teacher_user_id = ? AND class_id = ? AND assignment_type = 'SUBJECT_TEACHER' AND subject_id = ? AND status = 'ACTIVE'`,
      [schoolId, teacherUserId, classId, subjectId],
    );
    return row ? { assignmentId: row.assignment_id, schoolId: row.school_id, teacherUserId: row.teacher_user_id, classId: row.class_id, assignmentType: row.assignment_type, subjectId: row.subject_id, status: row.status, createdAt: row.created_at } : undefined;
  }

  async listStudents(
    schoolId: string,
    classId: string,
  ): Promise<LocalStudent[]> {
    const rows = await this.db.all<{
      student_id: string;
      school_id: string;
      class_id: string;
      admission_number?: string;
      display_name: string;
      gender?: "M" | "F";
      created_at: string;
    }>(
      `SELECT * FROM local_students
       WHERE school_id = ? AND class_id = ?
       ORDER BY display_name ASC`,
      [schoolId, classId],
    );

    return rows.map((row) => ({
      studentId: row.student_id,
      schoolId: row.school_id,
      classId: row.class_id,
      admissionNumber: row.admission_number,
      displayName: row.display_name,
      gender: row.gender,
      createdAt: row.created_at,
    }));
  }

  async getUser(schoolId: string, userId: string): Promise<LocalUser | undefined> {
    const row = await this.db.get<{ user_id: string; school_id: string; role: string; display_name: string; status?: "ACTIVE" | "DISABLED"; created_at: string }>(
      `SELECT * FROM local_users WHERE school_id = ? AND user_id = ?`, [schoolId, userId],
    );
    return row ? { userId: row.user_id, schoolId: row.school_id, role: row.role, displayName: row.display_name, status: row.status, createdAt: row.created_at } : undefined;
  }

  async listUsers(schoolId: string): Promise<LocalUser[]> {
    const rows = await this.db.all<{ user_id: string; school_id: string; role: string; display_name: string; status?: "ACTIVE" | "DISABLED"; created_at: string }>(
      `SELECT * FROM local_users WHERE school_id = ? ORDER BY display_name ASC`, [schoolId],
    );
    return rows.map((row) => ({ userId: row.user_id, schoolId: row.school_id, role: row.role, displayName: row.display_name, status: row.status, createdAt: row.created_at }));
  }

  async getDevice(schoolId: string, deviceId: string): Promise<LocalDevice | undefined> {
    const row = await this.db.get<{ device_id: string; school_id: string; user_id: string; node_type: string; is_trusted: number; status?: "ACTIVE" | "DISABLED"; created_at: string; last_seen_at?: string }>(
      `SELECT * FROM local_devices WHERE school_id = ? AND device_id = ?`, [schoolId, deviceId],
    );
    return row ? { deviceId: row.device_id, schoolId: row.school_id, userId: row.user_id, nodeType: row.node_type, isTrusted: row.is_trusted === 1, status: row.status, createdAt: row.created_at, lastSeenAt: row.last_seen_at } : undefined;
  }

  async listDevices(schoolId: string): Promise<LocalDevice[]> {
    const rows = await this.db.all<{ device_id: string; school_id: string; user_id: string; node_type: string; is_trusted: number; status?: "ACTIVE" | "DISABLED"; created_at: string; last_seen_at?: string }>(
      `SELECT * FROM local_devices WHERE school_id = ? ORDER BY created_at ASC`, [schoolId],
    );
    return rows.map((row) => ({ deviceId: row.device_id, schoolId: row.school_id, userId: row.user_id, nodeType: row.node_type, isTrusted: row.is_trusted === 1, status: row.status, createdAt: row.created_at, lastSeenAt: row.last_seen_at }));
  }

}
