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
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS local_schools (
        school_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_users (
        user_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        role TEXT NOT NULL,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_devices (
        device_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        node_type TEXT NOT NULL,
        is_trusted INTEGER NOT NULL DEFAULT 0,
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
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_teacher_assignments (
        assignment_id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL,
        teacher_user_id TEXT NOT NULL,
        class_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (school_id, class_id, subject_id)
      )
    `);
  }

  async saveSchool(school: LocalSchool): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_schools
       (school_id, name, created_at) VALUES (?, ?, ?)`,
      [school.schoolId, school.name, school.createdAt],
    );
  }

  async saveUser(user: LocalUser): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_users
       (user_id, school_id, role, display_name, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [user.userId, user.schoolId, user.role, user.displayName, user.createdAt],
    );
  }

  async saveDevice(device: LocalDevice): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO local_devices
       (device_id, school_id, user_id, node_type, is_trusted, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        device.deviceId,
        device.schoolId,
        device.userId,
        device.nodeType,
        device.isTrusted ? 1 : 0,
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
       (student_id, school_id, class_id, admission_number, display_name, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.studentId,
        item.schoolId,
        item.classId,
        item.admissionNumber ?? null,
        item.displayName,
        item.createdAt,
      ],
    );
  }

  async saveTeacherAssignment(item: LocalTeacherAssignment): Promise<void> {
    await this.db.run(
      `INSERT INTO local_teacher_assignments
       (assignment_id, school_id, teacher_user_id, class_id, subject_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.assignmentId,
        item.schoolId,
        item.teacherUserId,
        item.classId,
        item.subjectId,
        item.createdAt,
      ],
    );
  }

  async findTeacherAssignment(
    schoolId: string,
    teacherUserId: string,
    classId: string,
    subjectId: string,
  ): Promise<LocalTeacherAssignment | undefined> {
    const row = await this.db.get<{
      assignment_id: string;
      school_id: string;
      teacher_user_id: string;
      class_id: string;
      subject_id: string;
      created_at: string;
    }>(
      `SELECT * FROM local_teacher_assignments
       WHERE school_id = ? AND teacher_user_id = ?
       AND class_id = ? AND subject_id = ?`,
      [schoolId, teacherUserId, classId, subjectId],
    );

    return row
      ? {
          assignmentId: row.assignment_id,
          schoolId: row.school_id,
          teacherUserId: row.teacher_user_id,
          classId: row.class_id,
          subjectId: row.subject_id,
          createdAt: row.created_at,
        }
      : undefined;
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
      createdAt: row.created_at,
    }));
  }
}
