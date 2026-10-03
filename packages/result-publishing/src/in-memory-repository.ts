import type { ResultPublication } from "./model";
import type { ResultPublishingRepository } from "./repository";

export class ResultPublishingInMemoryRepository implements ResultPublishingRepository {
  private readonly publications = new Map<string, ResultPublication>();

  private key(schoolId: string, studentId: string, sessionId: string, termId: string): string {
    return [schoolId, studentId, sessionId, termId].join(":");
  }

  async save(publication: ResultPublication): Promise<void> {
    this.publications.set(
      this.key(publication.schoolId, publication.studentId, publication.sessionId, publication.termId),
      publication,
    );
  }

  async get(schoolId: string, studentId: string, sessionId: string, termId: string): Promise<ResultPublication | undefined> {
    return this.publications.get(this.key(schoolId, studentId, sessionId, termId));
  }

  async list(schoolId: string, classId?: string, sessionId?: string, termId?: string): Promise<ResultPublication[]> {
    return [...this.publications.values()].filter((item) =>
      item.schoolId === schoolId &&
      (!classId || item.classId === classId) &&
      (!sessionId || item.sessionId === sessionId) &&
      (!termId || item.termId === termId)
    );
  }
}
