import type { Subject } from "./model";
import type { SubjectRepository } from "./repository";

export class InMemorySubjectRepository implements SubjectRepository {
  private readonly items = new Map<string, Subject>();

  async save(subject: Subject): Promise<void> {
    this.items.set(subject.subjectId, subject);
  }

  async get(subjectId: string): Promise<Subject | undefined> {
    return this.items.get(subjectId);
  }

  async list(schoolId: string): Promise<Subject[]> {
    return [...this.items.values()].filter((item) => item.schoolId === schoolId);
  }
}
