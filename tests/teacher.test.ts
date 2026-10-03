import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryTeacherRepository } from "../packages/teacher/src/in-memory-repository";
import { TeacherService } from "../packages/teacher/src/service";

test("authorized user can create, update, and disable a teacher", async () => {
  const service = new TeacherService(new InMemoryTeacherRepository());

  const created = await service.create(
    {
      teacherId: "teacher-1",
      schoolId: "school-1",
      fullName: "  Aisha Bello  ",
      employeeNumber: " EMP-01 ",
      phone: " 08000000000 ",
      email: " teacher@example.com ",
      status: "ACTIVE",
      createdAt: "2026-10-03T08:00:00.000Z",
    },
    { canManage: true, canView: true },
  );

  assert.equal(created.fullName, "Aisha Bello");
  assert.equal(created.employeeNumber, "EMP-01");
  assert.equal(created.phone, "08000000000");
  assert.equal(created.email, "teacher@example.com");

  const updated = await service.update(
    "teacher-1",
    {
      fullName: "Musa Bello",
      employeeNumber: "EMP-02",
      phone: "08111111111",
      email: "musa@example.com",
    },
    { canManage: true, canView: true },
  );

  assert.equal(updated.fullName, "Musa Bello");
  assert.equal(updated.employeeNumber, "EMP-02");

  const disabled = await service.disable(
    "teacher-1",
    { canManage: true, canView: true },
  );

  assert.equal(disabled.status, "DISABLED");
});

test("teacher access is permission controlled", async () => {
  const service = new TeacherService(new InMemoryTeacherRepository());

  await assert.rejects(
    () => service.create(
      {
        teacherId: "teacher-1",
        schoolId: "school-1",
        fullName: "Aisha Bello",
        status: "ACTIVE",
        createdAt: "2026-10-03T08:00:00.000Z",
      },
      { canManage: false, canView: false },
    ),
    /Teacher management not permitted/,
  );

  await assert.rejects(
    () => service.list("school-1", { canManage: false, canView: false }),
    /Teacher viewing not permitted/,
  );
});

test("teacher name is required", async () => {
  const service = new TeacherService(new InMemoryTeacherRepository());

  await assert.rejects(
    () => service.create(
      {
        teacherId: "teacher-1",
        schoolId: "school-1",
        fullName: "   ",
        status: "ACTIVE",
        createdAt: "2026-10-03T08:00:00.000Z",
      },
      { canManage: true, canView: true },
    ),
    /Teacher name is required/,
  );
});
