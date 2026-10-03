import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySubjectRepository } from "../packages/subject/src/in-memory-repository";
import { SubjectService } from "../packages/subject/src/service";

test("authorized user can create, rename, and disable a subject", async () => {
  const service = new SubjectService(new InMemorySubjectRepository());

  const created = await service.create(
    {
      subjectId: "sub-1",
      schoolId: "school-1",
      name: "  Mathematics  ",
      status: "ACTIVE",
      createdAt: "2026-10-03T08:00:00.000Z",
    },
    { canManage: true, canView: true },
  );

  assert.equal(created.name, "Mathematics");

  const renamed = await service.rename(
    "sub-1",
    "English Language",
    { canManage: true, canView: true },
  );
  assert.equal(renamed.name, "English Language");

  const disabled = await service.disable(
    "sub-1",
    { canManage: true, canView: true },
  );
  assert.equal(disabled.status, "DISABLED");
});

test("subject access is permission controlled", async () => {
  const service = new SubjectService(new InMemorySubjectRepository());

  await assert.rejects(
    () => service.create(
      {
        subjectId: "sub-1",
        schoolId: "school-1",
        name: "Mathematics",
        status: "ACTIVE",
        createdAt: "2026-10-03T08:00:00.000Z",
      },
      { canManage: false, canView: false },
    ),
    /Subject management not permitted/,
  );

  await assert.rejects(
    () => service.list("school-1", { canManage: false, canView: false }),
    /Subject viewing not permitted/,
  );
});

test("subject name is required", async () => {
  const service = new SubjectService(new InMemorySubjectRepository());

  await assert.rejects(
    () => service.create(
      {
        subjectId: "sub-1",
        schoolId: "school-1",
        name: "   ",
        status: "ACTIVE",
        createdAt: "2026-10-03T08:00:00.000Z",
      },
      { canManage: true, canView: true },
    ),
    /Subject name is required/,
  );
});
