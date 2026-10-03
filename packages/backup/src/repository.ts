import type { BackupRecord } from "./model";

export interface BackupRepository {
  listRecords(schoolId: string): Promise<BackupRecord[]>;
  replaceRecords(schoolId: string, records: BackupRecord[]): Promise<void>;
}
