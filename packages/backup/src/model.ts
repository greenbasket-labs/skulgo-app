export interface BackupRecord {
  recordId: string;
  recordType: string;
  data: unknown;
}

export interface SchoolBackup {
  backupId: string;
  formatVersion: "1.0.0";
  schoolId: string;
  createdAt: string;
  createdByUserId: string;
  records: BackupRecord[];
}

export interface BackupInfo {
  backupId: string;
  formatVersion: string;
  schoolId: string;
  createdAt: string;
  createdByUserId: string;
  recordCount: number;
}

export interface BackupPermission {
  canCreate: boolean;
  canRestore: boolean;
}
