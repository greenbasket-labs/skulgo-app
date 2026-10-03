import assert from "node:assert/strict";
import test from "node:test";
import { MessagingInMemoryRepository } from "../packages/messaging/src/in-memory-repository";
import { MessagingService } from "../packages/messaging/src/service";

const canAll = {
  canSend: true,
  canViewInbox: true,
  canViewSent: true,
  canAnnounce: true,
};

test("user can send and read a direct message", async () => {
  const service = new MessagingService(new MessagingInMemoryRepository());

  await service.send({
    messageId: "message-1", schoolId: "school-1", senderUserId: "admin-1",
    recipientUserId: "teacher-1", subject: "Staff Meeting", body: "Meeting at 2 PM.",
    createdAt: "2026-10-03T08:00:00.000Z",
  }, canAll);

  const inbox = await service.getInbox("school-1", "teacher-1", canAll);
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].status, "SENT");

  const read = await service.markRead("message-1", "school-1", "teacher-1", "2026-10-03T09:00:00.000Z", canAll);
  assert.equal(read.status, "READ");
  assert.equal(read.readAt, "2026-10-03T09:00:00.000Z");
});

test("announcement creates one inbox message per recipient", async () => {
  const service = new MessagingService(new MessagingInMemoryRepository());

  const sent = await service.sendAnnouncement({
    messageIdPrefix: "announcement-1", schoolId: "school-1", senderUserId: "admin-1",
    recipientUserIds: ["teacher-1", "teacher-2", "teacher-1"],
    subject: "Holiday", body: "School closes Friday.", createdAt: "2026-10-03T08:00:00.000Z",
  }, canAll);

  assert.equal(sent.length, 2);
  assert.equal((await service.getInbox("school-1", "teacher-2", canAll)).length, 1);
  assert.equal(sent[0].type, "ANNOUNCEMENT");
});

test("user cannot view another user's message", async () => {
  const service = new MessagingService(new MessagingInMemoryRepository());

  await service.send({
    messageId: "message-2", schoolId: "school-1", senderUserId: "admin-1",
    recipientUserId: "teacher-1", subject: "Notice", body: "Private notice.",
    createdAt: "2026-10-03T08:00:00.000Z",
  }, canAll);

  await assert.rejects(
    service.markRead("message-2", "school-1", "teacher-2", "2026-10-03T09:00:00.000Z", canAll),
    /Message not found/,
  );
});

test("sending requires permission", async () => {
  const service = new MessagingService(new MessagingInMemoryRepository());

  await assert.rejects(
    service.send({
      messageId: "message-3", schoolId: "school-1", senderUserId: "teacher-1",
      recipientUserId: "admin-1", subject: "Question", body: "Hello.",
      createdAt: "2026-10-03T08:00:00.000Z",
    }, { ...canAll, canSend: false }),
    /not permitted/,
  );
});
