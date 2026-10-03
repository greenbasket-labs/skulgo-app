import assert from "node:assert/strict";
import test from "node:test";
import { ClassService } from "../packages/class/src/service";
import { InMemoryClassRepository } from "../packages/class/src/in-memory-repository";

test("authorized user can create and rename a class", async () => {
  const service = new ClassService(new InMemoryClassRepository());
  await service.create(
    { classId: "cls-1", schoolId: "school-1", name: "SS 1", createdAt: "2026-10-03T08:00:00.000Z" },
    { canManage: true, canView: true },
  );
  const updated = await service.rename("cls-1", "SS 1A", { canManage: true, canView: true });
  assert.equal(updated.name, "SS 1A");
});

test("class access is permission controlled", async () => {
  const service = new ClassService(new InMemoryClassRepository());
  await assert.rejects(
    () => service.list("school-1", { canManage: false, canView: false }),
    /Class viewing not permitted/,
  );
});
