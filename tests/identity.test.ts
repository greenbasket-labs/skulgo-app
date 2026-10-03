import assert from "node:assert/strict";
import test from "node:test";
import { IdentityInMemoryRepository } from "../packages/identity/src/in-memory-repository";
import { IdentityService } from "../packages/identity/src/service";

test("creates users and lists them", async () => {
  const service = new IdentityService(new IdentityInMemoryRepository());
  const user = await service.createUser({
    userId: "teacher-1",
    schoolId: "school-1",
    displayName: "Teacher One",
    role: "TEACHER",
    createdAt: "2026-10-03T08:00:00.000Z",
  });

  assert.equal(user.status, "ACTIVE");
  assert.equal((await service.listUsers("school-1")).length, 1);
});

test("disabled users cannot access modules", async () => {
  const service = new IdentityService(new IdentityInMemoryRepository());
  await service.createUser({
    userId: "teacher-1",
    schoolId: "school-1",
    displayName: "Teacher One",
    role: "TEACHER",
    createdAt: "2026-10-03T08:00:00.000Z",
  });
  await service.disableUser("school-1", "teacher-1");

  assert.equal(await service.canAccess({
    schoolId: "school-1",
    userId: "teacher-1",
    moduleId: "attendance",
    action: "view",
  }), false);
});

test("teacher access is limited to assigned resources", async () => {
  const service = new IdentityService(new IdentityInMemoryRepository());
  await service.createUser({
    userId: "teacher-1",
    schoolId: "school-1",
    displayName: "Teacher One",
    role: "TEACHER",
    createdAt: "2026-10-03T08:00:00.000Z",
  });

  assert.equal(await service.canAccess({
    schoolId: "school-1",
    userId: "teacher-1",
    moduleId: "attendance",
    action: "view",
    resource: { teacherUserId: "teacher-1" },
  }), true);

  assert.equal(await service.canAccess({
    schoolId: "school-1",
    userId: "teacher-1",
    moduleId: "attendance",
    action: "view",
    resource: { teacherUserId: "teacher-2" },
  }), false);
});

test("device registration requires an active user", async () => {
  const service = new IdentityService(new IdentityInMemoryRepository());
  await assert.rejects(
    service.registerDevice({
      deviceId: "device-1",
      schoolId: "school-1",
      userId: "missing",
      nodeType: "staff",
      createdAt: "2026-10-03T08:00:00.000Z",
    }),
    /User not found/,
  );
});
