import assert from "node:assert/strict";
import test from "node:test";
import type { RecordChange, SchoolRecord } from "../packages/school-records/src/record";
import type { SyncNode } from "../packages/sync/src/model";
import { MemoryChangeStore } from "../packages/sync/src/store";
import { ReplicationNode } from "../packages/sync/src/node";
import { connectLocalTransport } from "../packages/sync/src/transport";

const admin: SyncNode = {
  nodeId: "admin-device",
  schoolId: "school-1",
  nodeType: "primary_admin",
  userId: "admin-1",
};

const teacher: SyncNode = {
  nodeId: "teacher-device",
  schoolId: "school-1",
  nodeType: "staff",
  userId: "teacher-1",
};

function makeRecord(): SchoolRecord {
  return {
    recordId: "record-1",
    schoolId: "school-1",
    userId: "teacher-1",
    deviceId: "teacher-device",
    recordType: "attendance",
    createdAt: "2026-10-03T08:00:00.000Z",
    updatedAt: "2026-10-03T08:00:00.000Z",
    entityVersion: 1,
    classId: "class-1",
    studentId: "student-1",
    visibility: "teacher_assignment",
    payload: { status: "present" },
  };
}

function makeNode(deviceId: string): ReplicationNode {
  return new ReplicationNode(deviceId, new MemoryChangeStore());
}

test("local transport delivers an authorized school record", async () => {
  const sender = makeNode(teacher.nodeId);
  const receiver = makeNode(admin.nodeId);
  const change = sender.saveLocal(makeRecord());

  const transport = connectLocalTransport(
    { node: teacher, permission: { canSend: true, canReceive: false }, receiver: sender },
    { node: admin, permission: { canSend: false, canReceive: true }, receiver },
  );

  await sender.flush(transport);
  assert.deepEqual(receiver.getRecord(change.record.recordId)?.payload, { status: "present" });
  assert.deepEqual(sender.getRecord(change.record.recordId)?.payload, { status: "present" });
});

test("local transport rejects a cross-school connection", async () => {
  const sender = makeNode(teacher.nodeId);
  const receiver = makeNode(admin.nodeId);
  sender.saveLocal(makeRecord());
  const otherSchool = { ...admin, schoolId: "school-2" };

  const transport = connectLocalTransport(
    { node: teacher, permission: { canSend: true, canReceive: false }, receiver: sender },
    { node: otherSchool, permission: { canSend: false, canReceive: true }, receiver },
  );

  await assert.rejects(sender.flush(transport), /different schools/);
});

test("local transport rejects records hidden from the receiver", async () => {
  const sender = makeNode(teacher.nodeId);
  const receiver = makeNode("student-device");
  const change: RecordChange = sender.saveLocal({
    ...makeRecord(),
    visibility: "admin_private",
  });
  const student: SyncNode = {
    nodeId: "student-device",
    schoolId: "school-1",
    nodeType: "student",
    userId: "student-1",
  };

  const transport = connectLocalTransport(
    { node: teacher, permission: { canSend: true, canReceive: false }, receiver: sender },
    { node: student, permission: { canSend: false, canReceive: true }, receiver },
  );

  await assert.rejects(sender.flush(transport), /not visible/);
  assert.equal(receiver.getRecord(change.record.recordId), undefined);
});

test("local transport requires receiver permission", async () => {
  const sender = makeNode(teacher.nodeId);
  const receiver = makeNode(admin.nodeId);
  sender.saveLocal(makeRecord());

  const transport = connectLocalTransport(
    { node: teacher, permission: { canSend: true, canReceive: false }, receiver: sender },
    { node: admin, permission: { canSend: false, canReceive: false }, receiver },
  );

  await assert.rejects(sender.flush(transport), /receiving not permitted/);
});
