import assert from "node:assert/strict";
import test from "node:test";
import { BackupInMemoryRepository } from "../packages/backup/src/in-memory-repository";
import { BackupService } from "../packages/backup/src/service";

const permission = { canCreate: true, canRestore: true };

function record(id: string) {
  return {
    recordId: id,
    recordType: "student",
    data: { schoolId: "school-1", studentId: id, name: "Student " + id },
  };
}

test("creates a backup with records and metadata", async () => {
  const repository = new BackupInMemoryRepository([record("student-1"), record("student-2")]);
  const service = new BackupService(repository);

  const backup = await service.createBackup("school-1", "admin-1", "backup-1", "2026-10-03T08:00:00.000Z", permission);

  assert.equal(backup.formatVersion, "1.0.0");
  assert.equal(backup.records.length, 2);
  assert.equal(service.getInfo(backup).recordCount, 2);
});

test("restore rejects a backup from another school", async () => {
  const service = new BackupService(new BackupInMemoryRepository());
  const backup = {
    backupId: "backup-2",
    formatVersion: "1.0.0" as const,
    schoolId: "school-2",
    createdAt: "2026-10-03T08:00:00.000Z",
    createdByUserId: "admin-1",
    records: [],
  };

  await assert.rejects(service.restoreBackup(backup, "school-1", permission), /another school/);
});

test("restore refuses to overwrite existing records", async () => {
  const repository = new BackupInMemoryRepository([record("existing")]);
  const service = new BackupService(repository);
  const backup = await service.createBackup("school-1", "admin-1", "backup-3", "2026-10-03T08:00:00.000Z", permission);

  await assert.rejects(service.restoreBackup(backup, "school-1", permission), /empty school record store/);
});

test("backup permissions are enforced", async () => {
  const service = new BackupService(new BackupInMemoryRepository());

  await assert.rejects(
    service.createBackup("school-1", "admin-1", "backup-4", "2026-10-03T08:00:00.000Z", { canCreate: false, canRestore: false }),
    /not permitted/,
  );
});
