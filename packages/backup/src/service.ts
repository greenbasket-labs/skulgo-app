import type { BackupRepository } from "./repository";
import type { BackupInfo, BackupPermission, SchoolBackup } from "./model";

export class BackupService {
  constructor(private readonly repository: BackupRepository) {}

  async createBackup(
    schoolId: string,
    createdByUserId: string,
    backupId: string,
    createdAt: string,
    permission: BackupPermission,
  ): Promise<SchoolBackup> {
    if (!permission.canCreate) throw new Error("Backup creation not permitted");

    const records = await this.repository.listRecords(schoolId);
    return {
      backupId,
      formatVersion: "1.0.0",
      schoolId,
      createdAt,
      createdByUserId,
      records,
    };
  }

  getInfo(backup: SchoolBackup): BackupInfo {
    return {
      backupId: backup.backupId,
      formatVersion: backup.formatVersion,
      schoolId: backup.schoolId,
      createdAt: backup.createdAt,
      createdByUserId: backup.createdByUserId,
      recordCount: backup.records.length,
    };
  }

  async restoreBackup(
    backup: SchoolBackup,
    schoolId: string,
    permission: BackupPermission,
  ): Promise<void> {
    if (!permission.canRestore) throw new Error("Backup restore not permitted");
    if (backup.schoolId !== schoolId) throw new Error("Backup belongs to another school");
    if (backup.formatVersion !== "1.0.0") throw new Error("Unsupported backup format");

    const current = await this.repository.listRecords(schoolId);
    if (current.length > 0) throw new Error("Restore requires an empty school record store");

    await this.repository.replaceRecords(schoolId, backup.records);
  }
}
