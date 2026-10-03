import type { AttendanceRecord } from "./model";
import type { LocalRecordStore } from "../../school-records/src/repository";

export class AttendanceRepository {
  constructor(private readonly store: LocalRecordStore) {}

  async save(record: AttendanceRecord): Promise<void> {
    await this.store.put({
      recordId: record.recordId,
      schoolId: record.schoolId,
      recordType: record.recordType,
      createdByUserId: record.userId,
      createdByDeviceId: record.deviceId,
      sessionId: record.sessionId,
      termId: record.termId,
      classId: record.classId,
      studentId: record.studentId,
      entityVersion: record.entityVersion,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      payload: record.payload,
      visibilityScope: record.visibility,
    });
  }

  async listForStudent(
    schoolId: string,
    studentId: string,
  ): Promise<AttendanceRecord[]> {
    const rows = await this.store.listByType(schoolId, "attendance");

    return rows
      .filter((row) => row.studentId === studentId)
      .map((row) => ({
        recordId: row.recordId,
        schoolId: row.schoolId,
        userId: row.createdByUserId,
        deviceId: row.createdByDeviceId,
        recordType: "attendance" as const,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        entityVersion: row.entityVersion,
        sessionId: row.sessionId,
        termId: row.termId,
        classId: row.classId,
        studentId: row.studentId,
        visibility: row.visibilityScope as AttendanceRecord["visibility"],
        payload: row.payload as AttendanceRecord["payload"],
      }));
  }
}
