import assert from "node:assert/strict";
import test from "node:test";

import { SchoolService } from "../packages/school/src/service";
import { InMemorySchoolRepository } from "../packages/school/src/in-memory-repository";

test("school module exposes the school's own identity", async () => {
  const repository = new InMemorySchoolRepository();
  await repository.saveSchool({
    schoolId: "school-1",
    name: "Green Basket International School",
    createdAt: "2026-10-03T08:00:00.000Z",
  });

  const service = new SchoolService(repository);
  const school = await service.getSchool("school-1");

  assert.equal(school?.name, "Green Basket International School");
});

test("school module returns current academic session and term", async () => {
  const repository = new InMemorySchoolRepository();
  await repository.saveSession({
    sessionId: "session-1",
    schoolId: "school-1",
    name: "2026/2027",
    createdAt: "2026-10-03T08:00:00.000Z",
    isCurrent: true,
  });
  await repository.saveTerm({
    termId: "term-1",
    schoolId: "school-1",
    sessionId: "session-1",
    name: "First Term",
    createdAt: "2026-10-03T08:00:00.000Z",
    isCurrent: true,
  });

  const service = new SchoolService(repository);

  assert.equal((await service.getCurrentSession("school-1"))?.name, "2026/2027");
  assert.equal((await service.getCurrentTerm("school-1"))?.name, "First Term");
});
