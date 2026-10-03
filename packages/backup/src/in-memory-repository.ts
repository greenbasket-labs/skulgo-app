import type { BackupRecord } from "./model";
import type { BackupRepository } from "./repository";

export class BackupInMemoryRepository implements BackupRepository {
  private readonly records = new Map<string, BackupRecord>();

  constructor(initialRecords: BackupRecord[] = []) {
    for (const record of initialRecords) this.records.set(record.recordId, record);
  }

  async listRecords(schoolId: string): Promise<BackupRecord[]> {
    return [...this.records.values()].filter((record) => {
      const data = record.data as { schoolId?: string };
      return data.schoolId === schoolId;
    });
  }

  async replaceRecords(schoolId: string, records: BackupRecord[]): Promise<void> {
    for (const key of [...this.records.keys()]) {
      const current = this.records.get(key);
      const data = current?.data as { schoolId?: string } | undefined;
      if (data?.schoolId === schoolId) this.records.delete(key);
    }
    for (const record of records) this.records.set(record.recordId, record);
  }
}
