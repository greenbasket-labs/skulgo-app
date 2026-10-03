import type { ResultPublication } from "./model";
import type { ResultPublishingRepository } from "./repository";

export interface ResultPublishingPermission {
  canPublish: boolean;
  canViewPublished: boolean;
}

export class ResultPublishingService {
  constructor(private readonly repository: ResultPublishingRepository) {}

  async publish(
    input: Omit<ResultPublication, "status">,
    permission: ResultPublishingPermission,
  ): Promise<ResultPublication> {
    if (!permission.canPublish) throw new Error("Result publishing not permitted");

    const existing = await this.repository.get(
      input.schoolId, input.studentId, input.sessionId, input.termId,
    );
    const publication: ResultPublication = {
      ...(existing ?? input),
      ...input,
      status: "PUBLISHED",
    };
    await this.repository.save(publication);
    return publication;
  }

  async unpublish(
    schoolId: string,
    studentId: string,
    sessionId: string,
    termId: string,
    permission: ResultPublishingPermission,
    updatedAt: string,
  ): Promise<ResultPublication> {
    if (!permission.canPublish) throw new Error("Result publishing not permitted");
    const existing = await this.repository.get(schoolId, studentId, sessionId, termId);
    if (!existing) throw new Error("Published result not found");

    const unpublished: ResultPublication = {
      ...existing,
      status: "UNPUBLISHED",
      updatedAt,
    };
    await this.repository.save(unpublished);
    return unpublished;
  }

  async canViewResult(
    schoolId: string,
    studentId: string,
    sessionId: string,
    termId: string,
    permission: ResultPublishingPermission,
  ): Promise<boolean> {
    if (!permission.canViewPublished) throw new Error("Published result viewing not permitted");
    const publication = await this.repository.get(schoolId, studentId, sessionId, termId);
    return publication?.status === "PUBLISHED";
  }

  async listPublished(
    schoolId: string,
    classId: string | undefined,
    sessionId: string,
    termId: string,
    permission: ResultPublishingPermission,
  ): Promise<ResultPublication[]> {
    if (!permission.canPublish) throw new Error("Result publishing not permitted");
    const publications = await this.repository.list(schoolId, classId, sessionId, termId);
    return publications.filter((item) => item.status === "PUBLISHED");
  }
}
