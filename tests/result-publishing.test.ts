import assert from "node:assert/strict";
import test from "node:test";
import { ResultPublishingInMemoryRepository } from "../packages/result-publishing/src/in-memory-repository";
import { ResultPublishingService } from "../packages/result-publishing/src/service";

const base = {
  publicationId: "pub-1",
  schoolId: "school-1",
  studentId: "student-1",
  classId: "ss1",
  sessionId: "2026-2027",
  termId: "term-1",
  publishedAt: "2026-10-03T08:00:00.000Z",
  publishedByUserId: "admin-1",
  updatedAt: "2026-10-03T08:00:00.000Z",
};

test("publishes an existing student's result scope", async () => {
  const service = new ResultPublishingService(new ResultPublishingInMemoryRepository());
  const publication = await service.publish(base, { canPublish: true, canViewPublished: true });
  assert.equal(publication.status, "PUBLISHED");
  assert.equal(
    await service.canViewResult("school-1", "student-1", "2026-2027", "term-1",
      { canPublish: false, canViewPublished: true }),
    true,
  );
});

test("unpublished results are not visible to published-result viewers", async () => {
  const service = new ResultPublishingService(new ResultPublishingInMemoryRepository());
  await service.publish(base, { canPublish: true, canViewPublished: true });
  await service.unpublish("school-1", "student-1", "2026-2027", "term-1",
    { canPublish: true, canViewPublished: false }, "2026-10-03T09:00:00.000Z");
  assert.equal(
    await service.canViewResult("school-1", "student-1", "2026-2027", "term-1",
      { canPublish: false, canViewPublished: true }),
    false,
  );
});

test("publishing requires permission", async () => {
  const service = new ResultPublishingService(new ResultPublishingInMemoryRepository());
  await assert.rejects(
    service.publish(base, { canPublish: false, canViewPublished: true }),
    /publishing not permitted/,
  );
});

test("school isolation is enforced", async () => {
  const service = new ResultPublishingService(new ResultPublishingInMemoryRepository());
  await service.publish(base, { canPublish: true, canViewPublished: true });
  assert.equal(
    await service.canViewResult("school-2", "student-1", "2026-2027", "term-1",
      { canPublish: false, canViewPublished: true }),
    false,
  );
});
