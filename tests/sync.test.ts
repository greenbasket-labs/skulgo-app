import assert from "node:assert/strict";
import test from "node:test";
import type { RecordChange, SchoolRecord } from "../packages/school-records/src/record";
import { SyncInMemoryRepository } from "../packages/sync/src/in-memory-repository";
import { SyncService } from "../packages/sync/src/service";
import type { SyncNode } from "../packages/sync/src/model";

const admin: SyncNode = { nodeId: "admin-device", schoolId: "school-1", nodeType: "primary_admin", userId: "admin-1" };
const teacher: SyncNode = { nodeId: "teacher-device", schoolId: "school-1", nodeType: "staff", userId: "teacher-1" };
const record: SchoolRecord = {
  recordId: "record-1", schoolId: "school-1", userId: "teacher-1", deviceId: "teacher-device",
  recordType: "attendance", createdAt: "2026-10-03T08:00:00.000Z", updatedAt: "2026-10-03T08:00:00.000Z",
  entityVersion: 1, classId: "class-1", studentId: "student-1", visibility: "teacher_assignment",
  payload: { status: "present" },
};
const change: RecordChange = { changeId: "change-1", record, actorUserId: "teacher-1", actorDeviceId: "teacher-device", createdAt: "2026-10-03T08:00:00.000Z" };
const send = { canSend: true, canReceive: false };
const receive = { canSend: false, canReceive: true };

test("queues and lists a pending change", async () => {
  const service = new SyncService(new SyncInMemoryRepository());
  await service.queueChange(change, teacher, send);
  const pending = await service.listPending("teacher-device");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].status, "PENDING");
});

test("only prepares records visible to the target node", async () => {
  const service = new SyncService(new SyncInMemoryRepository());
  const queued = await service.queueChange(change, teacher, send);
  assert.equal((await service.prepareForNode(queued, admin, send))?.targetNodeId, "admin-device");
  const other: SyncNode = { ...teacher, nodeId: "other-device", userId: "other-user" };
  assert.equal(await service.prepareForNode(queued, other, send), undefined);
});

test("applies an envelope idempotently", async () => {
  const repository = new SyncInMemoryRepository();
  const service = new SyncService(repository);
  const queued = await service.queueChange(change, teacher, send);
  const envelope = await service.prepareForNode(queued, admin, send);
  assert.ok(envelope);
  assert.equal(await service.applyEnvelope(envelope, admin, receive), "APPLIED");
  assert.equal(await service.applyEnvelope(envelope, admin, receive, record), "DUPLICATE");
});

test("rejects cross-school envelopes", async () => {
  const service = new SyncService(new SyncInMemoryRepository());
  const otherSchool: SyncNode = { ...admin, schoolId: "school-2" };
  await assert.rejects(
    service.applyEnvelope({
      changeId: "change-2", schoolId: "school-1", sourceNodeId: "teacher-device", targetNodeId: "admin-device",
      record, actorUserId: "teacher-1", createdAt: "2026-10-03T08:00:00.000Z",
    }, otherSchool, receive),
    /another school/,
  );
});

test("acknowledges a queued change", async () => {
  const service = new SyncService(new SyncInMemoryRepository());
  await service.queueChange(change, teacher, send);
  assert.equal((await service.acknowledge("change-1")).status, "ACKNOWLEDGED");
});
