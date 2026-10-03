import assert from "node:assert/strict";
import test from "node:test";
import { ConnectionInMemoryRepository } from "../packages/connection/src/in-memory-repository";
import { ConnectionService } from "../packages/connection/src/service";

test("lists connection status for one school only", async () => {
  const repository = new ConnectionInMemoryRepository();
  await repository.save({
    deviceId: "admin-device",
    schoolId: "school-1",
    displayName: "Admin Phone",
    userId: "admin-1",
    status: "CONNECTED",
    lastSeenAt: "2026-10-03T08:00:00.000Z",
  });
  await repository.save({
    deviceId: "other-device",
    schoolId: "school-2",
    displayName: "Other Phone",
    userId: "admin-2",
    status: "CONNECTED",
  });

  const service = new ConnectionService(repository);
  const devices = await service.listDevices("school-1", { canView: true, canUpdate: false });
  assert.equal(devices.length, 1);
  assert.equal(devices[0].deviceId, "admin-device");
});

test("updates a paired device to connected and records last seen", async () => {
  const repository = new ConnectionInMemoryRepository();
  await repository.save({
    deviceId: "teacher-device",
    schoolId: "school-1",
    displayName: "Teacher Phone",
    userId: "teacher-1",
    status: "PAIRED",
  });

  const service = new ConnectionService(repository);
  const updated = await service.updateStatus(
    "school-1",
    "teacher-device",
    "CONNECTED",
    "2026-10-03T08:05:00.000Z",
    { canView: false, canUpdate: true },
  );

  assert.equal(updated.status, "CONNECTED");
  assert.equal(updated.lastSeenAt, "2026-10-03T08:05:00.000Z");
});

test("can mark a device offline without changing its pairing identity", async () => {
  const repository = new ConnectionInMemoryRepository();
  await repository.save({
    deviceId: "teacher-device",
    schoolId: "school-1",
    displayName: "Teacher Phone",
    userId: "teacher-1",
    status: "CONNECTED",
  });

  const service = new ConnectionService(repository);
  const updated = await service.updateStatus(
    "school-1",
    "teacher-device",
    "OFFLINE",
    undefined,
    { canView: false, canUpdate: true },
  );

  assert.equal(updated.status, "OFFLINE");
  assert.equal(updated.deviceId, "teacher-device");
  assert.equal(updated.userId, "teacher-1");
});

test("rejects unauthorized status changes", async () => {
  const repository = new ConnectionInMemoryRepository();
  await repository.save({
    deviceId: "teacher-device",
    schoolId: "school-1",
    displayName: "Teacher Phone",
    userId: "teacher-1",
    status: "PAIRED",
  });

  const service = new ConnectionService(repository);
  await assert.rejects(
    service.updateStatus(
      "school-1",
      "teacher-device",
      "CONNECTED",
      "2026-10-03T08:05:00.000Z",
      { canView: true, canUpdate: false },
    ),
    /update not permitted/,
  );
});

test("rejects access to another school device", async () => {
  const repository = new ConnectionInMemoryRepository();
  await repository.save({
    deviceId: "other-device",
    schoolId: "school-2",
    displayName: "Other Phone",
    userId: "admin-2",
    status: "CONNECTED",
  });

  const service = new ConnectionService(repository);
  await assert.rejects(
    service.getDevice("school-1", "other-device", { canView: true, canUpdate: false }),
    /not found/,
  );
});
