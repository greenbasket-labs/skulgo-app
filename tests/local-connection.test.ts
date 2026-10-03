import assert from "node:assert/strict";
import test from "node:test";
import type { RecordChange } from "../packages/school-records/src/record";
import { LocalNetworkConnection } from "../packages/connection/src/local-adapter";

const change = {
  changeId: "change-1",
  actorUserId: "teacher-1",
  actorDeviceId: "teacher-device",
  createdAt: "2026-10-03T08:00:00.000Z",
  record: {
    recordId: "record-1",
    schoolId: "school-1",
    userId: "teacher-1",
    deviceId: "teacher-device",
    recordType: "attendance",
    visibility: "school_official",
    createdAt: "2026-10-03T08:00:00.000Z",
    updatedAt: "2026-10-03T08:00:00.000Z",
    entityVersion: 1,
    payload: { status: "present" },
  },
} as RecordChange<{ status: string }>;

test("connects approved devices from the same school", async () => {
  const connection = new LocalNetworkConnection(
    { deviceId: "teacher-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device",
      receivedAt: "2026-10-03T08:00:01.000Z",
      acknowledgedAt: "2026-10-03T08:00:02.000Z",
    }) },
    { deviceId: "admin-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device",
      receivedAt: "2026-10-03T08:00:01.000Z",
      acknowledgedAt: "2026-10-03T08:00:02.000Z",
    }) },
  );

  assert.equal(connection.isConnected(), false);
  await connection.connect();
  assert.equal(connection.isConnected(), true);
  const receipt = await connection.send(change);
  assert.equal(receipt.receiverDeviceId, "admin-device");
});

test("refuses unapproved devices", async () => {
  const connection = new LocalNetworkConnection(
    { deviceId: "teacher-device", schoolId: "school-1", approved: false, send: async () => {
      throw new Error("should not send");
    } },
    { deviceId: "admin-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device", receivedAt: "now", acknowledgedAt: "now",
    }) },
  );

  await assert.rejects(connection.connect(), /approved devices/);
});

test("refuses different schools", async () => {
  const connection = new LocalNetworkConnection(
    { deviceId: "teacher-device", schoolId: "school-1", approved: true, send: async () => {
      throw new Error("should not send");
    } },
    { deviceId: "admin-device", schoolId: "school-2", approved: true, send: async () => {
      throw new Error("should not send");
    } },
  );

  await assert.rejects(connection.connect(), /different schools/);
});

test("cannot send before connection", async () => {
  const connection = new LocalNetworkConnection(
    { deviceId: "teacher-device", schoolId: "school-1", approved: true, send: async () => {
      throw new Error("should not send");
    } },
    { deviceId: "admin-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device", receivedAt: "now", acknowledgedAt: "now",
    }) },
  );

  await assert.rejects(connection.send(change), /not connected/);
});

test("disconnect stops sending", async () => {
  const connection = new LocalNetworkConnection(
    { deviceId: "teacher-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device", receivedAt: "now", acknowledgedAt: "now",
    }) },
    { deviceId: "admin-device", schoolId: "school-1", approved: true, send: async () => ({
      receiverDeviceId: "admin-device", receivedAt: "now", acknowledgedAt: "now",
    }) },
  );

  await connection.connect();
  await connection.disconnect();
  await assert.rejects(connection.send(change), /not connected/);
});
