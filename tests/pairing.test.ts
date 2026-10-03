import assert from "node:assert/strict";
import test from "node:test";
import { PairingInMemoryRepository } from "../packages/pairing/src/in-memory-repository";
import { PairingService } from "../packages/pairing/src/service";
import type { PairingDevice } from "../packages/pairing/src/model";

const requester: PairingDevice = {
  deviceId: "teacher-device",
  schoolId: "school-1",
  userId: "teacher-1",
  nodeType: "staff",
  isTrusted: false,
  status: "ACTIVE",
};
const admin: PairingDevice = {
  deviceId: "admin-device",
  schoolId: "school-1",
  userId: "admin-1",
  nodeType: "primary_admin",
  isTrusted: true,
  status: "ACTIVE",
};

test("creates a pending local pairing request", async () => {
  const service = new PairingService(new PairingInMemoryRepository());
  const request = await service.requestConnection({
    pairingId: "pair-1",
    schoolId: "school-1",
    requesterDeviceId: requester.deviceId,
    requesterUserId: requester.userId,
    targetDeviceId: admin.deviceId,
    createdAt: "2026-10-03T08:00:00.000Z",
  }, requester, admin, { canRequest: true, canApprove: false });
  assert.equal(request.status, "PENDING");
});

test("admin can approve a pending request", async () => {
  const service = new PairingService(new PairingInMemoryRepository());
  await service.requestConnection({
    pairingId: "pair-2",
    schoolId: "school-1",
    requesterDeviceId: requester.deviceId,
    requesterUserId: requester.userId,
    targetDeviceId: admin.deviceId,
    createdAt: "2026-10-03T08:00:00.000Z",
  }, requester, admin, { canRequest: true, canApprove: false });
  const approved = await service.approve("school-1", "pair-2", admin, "admin-1",
    { canRequest: false, canApprove: true }, "2026-10-03T08:01:00.000Z");
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.reviewedByUserId, "admin-1");
});

test("rejects cross-school pairing", async () => {
  const service = new PairingService(new PairingInMemoryRepository());
  await assert.rejects(
    service.requestConnection({
      pairingId: "pair-3",
      schoolId: "school-1",
      requesterDeviceId: requester.deviceId,
      requesterUserId: requester.userId,
      targetDeviceId: "other-admin",
      createdAt: "2026-10-03T08:00:00.000Z",
    }, requester, { ...admin, deviceId: "other-admin", schoolId: "school-2" },
    { canRequest: true, canApprove: false }),
    /different schools/,
  );
});

test("disabled devices cannot pair", async () => {
  const service = new PairingService(new PairingInMemoryRepository());
  await assert.rejects(
    service.requestConnection({
      pairingId: "pair-4",
      schoolId: "school-1",
      requesterDeviceId: requester.deviceId,
      requesterUserId: requester.userId,
      targetDeviceId: admin.deviceId,
      createdAt: "2026-10-03T08:00:00.000Z",
    }, { ...requester, status: "DISABLED" }, admin,
    { canRequest: true, canApprove: false }),
    /active devices/,
  );
});

test("only the target device can approve its request", async () => {
  const service = new PairingService(new PairingInMemoryRepository());
  await service.requestConnection({
    pairingId: "pair-5",
    schoolId: "school-1",
    requesterDeviceId: requester.deviceId,
    requesterUserId: requester.userId,
    targetDeviceId: admin.deviceId,
    createdAt: "2026-10-03T08:00:00.000Z",
  }, requester, admin, { canRequest: true, canApprove: false });
  await assert.rejects(
    service.approve("school-1", "pair-5", { ...admin, deviceId: "other-admin" },
      "admin-1", { canRequest: false, canApprove: true }, "2026-10-03T08:01:00.000Z"),
    /targets another device/,
  );
});
